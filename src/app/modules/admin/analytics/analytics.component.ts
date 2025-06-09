import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
// Update Chart.js imports for v4
import {
  Chart,
  LineController, BarController, DoughnutController, RadarController,
  CategoryScale, LinearScale, RadialLinearScale,
  PointElement, LineElement, ArcElement, BarElement,
  Tooltip, Legend, Title
} from 'chart.js';
import {Subject, forkJoin, takeUntil, Observable, catchError, of} from 'rxjs';

// Register Chart.js components
Chart.register(
  LineController, BarController, DoughnutController, RadarController,
  CategoryScale, LinearScale, RadialLinearScale,
  PointElement, LineElement, ArcElement, BarElement,
  Tooltip, Legend, Title
);
import {
  AdminStatisticsService,
  CustomerOrderStatsProjection,
  DailyOrderStatsProjection,
  MonthlyOrderStatsProjection,
  OrderStatsProjection,
  OrderStatusDistributionProjection,
  ProductSalesStatsProjection,
  RevenueByPeriodProjection,
  TopCustomersProjection,
  TopSellingProductProjection
} from '../../openapi';
import { ToastService } from '../../../services/toast';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss']
})
export class AnalyticsComponent implements OnInit, AfterViewInit, OnDestroy {
  // Chart references
  @ViewChild('revenueChart') revenueChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('orderStatusChart') orderStatusChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('productSalesChart') productSalesChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('customerSpendingChart') customerSpendingChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('monthlyTrendsChart') monthlyTrendsChartRef!: ElementRef<HTMLCanvasElement>;

  // Chart instances
  revenueChart!: Chart;
  orderStatusChart!: Chart;
  productSalesChart!: Chart;
  customerSpendingChart!: Chart;
  monthlyTrendsChart!: Chart;

  // Data
  orderStats!: OrderStatsProjection;
  dailyOrderStats: DailyOrderStatsProjection[] = [];
  monthlyOrderStats: MonthlyOrderStatsProjection[] = [];
  orderStatusDistribution: OrderStatusDistributionProjection[] = [];
  productSalesStats: ProductSalesStatsProjection[] = [];
  topCustomers: TopCustomersProjection[] = [];
  topSellingProducts: TopSellingProductProjection[] = [];

  // UI state
  isLoading = true;
  periodControl = new FormControl('week');

  // Cleanup
  private destroy$ = new Subject<void>();

  constructor(
    private adminStatsService: AdminStatisticsService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadAnalyticsData();

    // React to period changes
    this.periodControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(period => {
        if (period) {
          this.loadTimeSeriesData(period);
        }
      });
  }

  ngAfterViewInit(): void {
    // Wait for view to be ready, then initialize charts
    setTimeout(() => {
      console.log('Initializing charts...'); // Debug
      console.log('Chart refs available:', this.chartsRefsAvailable()); // Debug
      this.initializeCharts();
    }, 300); // Increase timeout to ensure DOM is ready
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Destroy charts to prevent memory leaks
    this.destroyCharts();
  }

  loadAnalyticsData(): void {
    this.isLoading = true;

    // Load all data in parallel
    forkJoin({
      orderStats: this.adminStatsService.getOrderStatistics(),
      orderStatus: this.adminStatsService.getOrderStatusDistribution(),
      productSales: this.adminStatsService.getProductSalesStatistics(),
      topCustomers: this.adminStatsService.getTopCustomers(10),
      topProducts: this.adminStatsService.getTopSellingProducts(10)
    }).subscribe({
      next: (data) => {
        console.log('Analytics data loaded:', data); // Debug data
        this.orderStats = data.orderStats;
        this.orderStatusDistribution = data.orderStatus;
        this.productSalesStats = data.productSales;
        this.topCustomers = data.topCustomers;
        this.topSellingProducts = data.topProducts;

        // Load time series data based on selected period
        const currentPeriod = this.periodControl.value || 'week';
        this.loadTimeSeriesData(currentPeriod);
      },
      error: (error) => {
        console.error('Failed to load analytics data:', error); // Debug errors
        this.toastService.showError('Failed to load analytics data', error);
        this.isLoading = false;
      }
    });
  }

  loadTimeSeriesData(period: string): void {
    this.isLoading = true;
    console.log(`Loading ${period} data...`);

    let apiCall: Observable<any>;

    switch (period) {
      case 'week':
        apiCall = this.adminStatsService.getLastWeekOrderStats();
        break;
      case 'month':
        apiCall = this.adminStatsService.getLastMonthOrderStats();
        break;
      case 'year':
        apiCall = this.adminStatsService.getLastYearOrderStats();
        break;
      default:
        apiCall = this.adminStatsService.getLastWeekOrderStats();
    }

    apiCall.pipe(
      catchError((err: string | undefined) => {
        console.error(`Failed to load ${period} data:`, err);
        this.toastService.showError(`Failed to load ${period} data`, err);
        this.isLoading = false;
        return of([]);
      })
    ).subscribe({
      next: (data) => {
        console.log(`${period} data loaded:`, data);

        if (period === 'year') {
          this.monthlyOrderStats = data;
          this.dailyOrderStats = [];
          this.updateRevenueChart(true);
        } else {
          this.dailyOrderStats = data;
          this.monthlyOrderStats = [];
          this.updateRevenueChart(false);
        }

        // Update other charts that might depend on this data
        this.updateOrderStatusChart();
        this.updateProductSalesChart();
        this.updateCustomerSpendingChart();
        this.updateMonthlyTrendsChart();

        this.isLoading = false;
      },
      error: (error) => {
        console.error(`Failed to load ${period} data:`, error);
        this.toastService.showError(`Failed to load ${period} data`, error);
        this.isLoading = false;
      }
    });
  }

  initializeCharts(): void {
    if (!this.chartsRefsAvailable()) {
      console.warn('Chart references not available yet');
      return;
    }

    this.createRevenueChart();
    this.createOrderStatusChart();
    this.createProductSalesChart();
    this.createCustomerSpendingChart();
    this.createMonthlyTrendsChart();
  }

  updateCharts(): void {
    this.updateRevenueChart();
    this.updateOrderStatusChart();
    this.updateProductSalesChart();
    this.updateCustomerSpendingChart();
    this.updateMonthlyTrendsChart();
  }

  createRevenueChart(): void {
    const ctx = this.revenueChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.revenueChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Revenue',
          data: [],
          borderColor: '#4e73df',
          backgroundColor: 'rgba(78, 115, 223, 0.05)',
          borderWidth: 3,
          pointRadius: 3,
          pointBackgroundColor: '#4e73df',
          pointBorderColor: '#fff',
          pointHoverRadius: 5,
          fill: true,
          tension: 0.3
        }, {
          label: 'Orders',
          data: [],
          borderColor: '#1cc88a',
          backgroundColor: 'rgba(28, 200, 138, 0)',
          borderWidth: 2,
          pointRadius: 2,
          pointBackgroundColor: '#1cc88a',
          pointBorderColor: '#fff',
          pointHoverRadius: 4,
          fill: false,
          tension: 0.3,
          yAxisID: 'y1'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#4e73df',
            borderWidth: 1,
            callbacks: {
              label: (tooltipItem) => {
                const datasetLabel = tooltipItem.dataset.label || '';
                const value = tooltipItem.parsed.y;
                return datasetLabel + ': ' + (datasetLabel === 'Revenue' ?
                  this.formatCurrency(value) : this.formatNumber(value));
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              callback: function(value: string | number) {
                // Convert to number if it's a string
                const numValue = typeof value === 'string' ? parseFloat(value) : value;
                // Use the component's formatCurrency method, but handle 'this' context
                return new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(numValue);
              }
            }
          },
          y1: {
            position: 'right',
            beginAtZero: true,
            grid: {
              display: false
            },
            ticks: {
              callback: function(value: string | number) {
                // Convert to number if it's a string
                const numValue = typeof value === 'string' ? parseFloat(value) : value;
                // Use a direct number formatter instead of this.formatNumber
                return new Intl.NumberFormat().format(numValue);
              }
            }
          },
          x: {
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          }
        }
      }
    });
  }

  updateRevenueChart(isYearly = false): void {
    if (!this.revenueChart) {
      console.warn('Revenue chart not initialized');
      return;
    }

    let labels: string[] = [];
    let revenueData: number[] = [];
    let orderData: number[] = [];

    try {
      if (isYearly && this.monthlyOrderStats.length > 0) {
        // Format monthly data
        labels = this.monthlyOrderStats.map(stat => {
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return monthNames[(stat.month || 1) - 1] + ' ' + stat.year;
        });
        revenueData = this.monthlyOrderStats.map(stat => stat.monthlyRevenue || 0);
        orderData = this.monthlyOrderStats.map(stat => stat.orderCount || 0);
      } else if (this.dailyOrderStats.length > 0) {
        // Format daily data
        labels = this.dailyOrderStats.map(stat => {
          const date = new Date(stat.orderDate || '');
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        revenueData = this.dailyOrderStats.map(stat => stat.dailyRevenue || 0);
        orderData = this.dailyOrderStats.map(stat => stat.orderCount || 0);
      } else {
        console.warn('No data available for revenue chart');
        return;
      }

      console.log('Chart data prepared:', { labels, revenueData, orderData });

      this.revenueChart.data.labels = labels;
      this.revenueChart.data.datasets[0].data = revenueData;
      this.revenueChart.data.datasets[1].data = orderData;
      this.revenueChart.update();
    } catch (error) {
      console.error('Error updating revenue chart:', error);
    }
  }

  createOrderStatusChart(): void {
    const ctx = this.orderStatusChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.orderStatusChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [
            '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796'
          ],
          hoverBackgroundColor: [
            '#2e59d9', '#17a673', '#2c9faf', '#dda20a', '#be2617', '#60616f'
          ],
          hoverBorderColor: "white"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 20
            }
          },
          tooltip: {
            backgroundColor: 'rgb(255, 255, 255)',
            bodyColor: '#858796',
            titleColor: '#6e707e',
            borderColor: '#dddfeb',
            borderWidth: 1,
            padding: 15,
            displayColors: false,
            callbacks: {
              label: function(tooltipItem) {
                const label = tooltipItem.label || '';
                const value = tooltipItem.parsed;
                const total = tooltipItem.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = Math.round((value / total) * 100);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        },
        cutout: '70%'
      }
    });
  }

  updateOrderStatusChart(): void {
    if (!this.orderStatusChart || !this.orderStatusDistribution.length) return;

    this.orderStatusChart.data.labels = this.orderStatusDistribution.map(item => item.status);
    this.orderStatusChart.data.datasets[0].data = this.orderStatusDistribution.map(item => item.count || 0);
    this.orderStatusChart.update();
  }

  createProductSalesChart(): void {
    const ctx = this.productSalesChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.productSalesChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          label: 'Revenue',
          data: [],
          backgroundColor: 'rgba(78, 115, 223, 0.8)',
          borderColor: 'rgba(78, 115, 223, 1)',
          borderWidth: 1
        }, {
          label: 'Quantity',
          data: [],
          backgroundColor: 'rgba(28, 200, 138, 0.8)',
          borderColor: 'rgba(28, 200, 138, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            backgroundColor: 'rgb(255, 255, 255)',
            bodyColor: '#858796',
            titleColor: '#6e707e',
            borderColor: '#dddfeb',
            borderWidth: 1,
            padding: 15,
            callbacks: {
              label: function(tooltipItem) {
                const label = tooltipItem.dataset.label || '';
                const value = tooltipItem.parsed.x;
                if (label === 'Revenue') {
                  return label + ': $' + value.toLocaleString();
                } else {
                  return label + ': ' + value.toLocaleString();
                }
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: "rgb(234, 236, 244)"
            },
            ticks: {
              callback: function(value) {
                return '$' + value.toLocaleString();
              }
            }
          },
          y: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  updateProductSalesChart(): void {
    if (!this.productSalesChart || !this.productSalesStats.length) return;

    // Limit to top 8 products for better visualization
    const topProducts = this.productSalesStats.slice(0, 8);

    this.productSalesChart.data.labels = topProducts.map(item => item.productName);
    this.productSalesChart.data.datasets[0].data = topProducts.map(item => item.totalRevenue || 0);
    this.productSalesChart.data.datasets[1].data = topProducts.map(item => item.totalQuantity || 0);
    this.productSalesChart.update();
  }

  createCustomerSpendingChart(): void {
    const ctx = this.customerSpendingChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.customerSpendingChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          label: 'Total Spent',
          data: [],
          backgroundColor: 'rgba(54, 185, 204, 0.8)',
          borderColor: 'rgba(54, 185, 204, 1)',
          borderWidth: 1
        }, {
          label: 'Orders',
          data: [],
          backgroundColor: 'rgba(246, 194, 62, 0.8)',
          borderColor: 'rgba(246, 194, 62, 1)',
          borderWidth: 1,
          yAxisID: 'y1'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            backgroundColor: 'rgb(255, 255, 255)',
            bodyColor: '#858796',
            titleColor: '#6e707e',
            borderColor: '#dddfeb',
            borderWidth: 1,
            padding: 15,
            callbacks: {
              label: function(tooltipItem) {
                const label = tooltipItem.dataset.label || '';
                const value = tooltipItem.parsed.y;
                if (label === 'Total Spent') {
                  return label + ': $' + value.toLocaleString();
                } else {
                  return label + ': ' + value.toLocaleString();
                }
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            }
          },
          y: {
            ticks: {
              callback: function(value) {
                return '$' + value.toLocaleString();
              }
            },
            grid: {
              color: "rgb(234, 236, 244)"
            }
          },
          y1: {
            position: 'right',
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  updateCustomerSpendingChart(): void {
    if (!this.customerSpendingChart || !this.topCustomers.length) return;

    // Limit to top 5 customers for better visualization
    const topCustomers = this.topCustomers.slice(0, 5);

    this.customerSpendingChart.data.labels = topCustomers.map(item => item.userName || item.email || '');
    this.customerSpendingChart.data.datasets[0].data = topCustomers.map(item => item.totalSpent || 0);
    this.customerSpendingChart.data.datasets[1].data = topCustomers.map(item => item.totalOrders || 0);
    this.customerSpendingChart.update();
  }

  createMonthlyTrendsChart(): void {
    const ctx = this.monthlyTrendsChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.monthlyTrendsChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [{
          label: 'Revenue',
          data: Array(12).fill(0),
          backgroundColor: 'rgba(78, 115, 223, 0.2)',
          borderColor: 'rgba(78, 115, 223, 1)',
          pointBackgroundColor: 'rgba(78, 115, 223, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(78, 115, 223, 1)',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            backgroundColor: 'rgb(255, 255, 255)',
            bodyColor: '#858796',
            titleColor: '#6e707e',
            borderColor: '#dddfeb',
            borderWidth: 1,
            padding: 15,
            callbacks: {
              label: function(tooltipItem: any) {
                const label = tooltipItem.dataset.label || '';
                const value = tooltipItem.raw as number;
                return label + ': $' + value.toLocaleString();
              }
            }
          }
        },
        scales: {
          r: {
            angleLines: {
              display: true,
              color: 'rgba(0, 0, 0, 0.1)'
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            },
            pointLabels: {
              font: {
                size: 12
              }
            },
            ticks: {
              backdropColor: 'rgba(255, 255, 255, 0.75)',
              font: {
                size: 10
              },
              callback: function(tickValue: string | number, index: number, ticks: any[]) {
                const numValue = typeof tickValue === 'string' ? parseFloat(tickValue) : tickValue;

                if (numValue === 0) return '';
                return '$' + numValue.toLocaleString();
              }
            }
          }
        }
      }
    });
  }

  updateMonthlyTrendsChart(): void {
    if (!this.monthlyTrendsChart || !this.monthlyOrderStats.length) return;

    // Initialize array with zeros for all months
    const monthlyData = Array(12).fill(0);

    // Fill in data for months we have
    this.monthlyOrderStats.forEach(stat => {
      if (stat.month && stat.month >= 1 && stat.month <= 12) {
        monthlyData[stat.month - 1] = stat.monthlyRevenue || 0;
      }
    });

    this.monthlyTrendsChart.data.datasets[0].data = monthlyData;
    this.monthlyTrendsChart.update();
  }

  destroyCharts(): void {
    if (this.revenueChart) this.revenueChart.destroy();
    if (this.orderStatusChart) this.orderStatusChart.destroy();
    if (this.productSalesChart) this.productSalesChart.destroy();
    if (this.customerSpendingChart) this.customerSpendingChart.destroy();
    if (this.monthlyTrendsChart) this.monthlyTrendsChart.destroy();
  }

  chartsRefsAvailable(): boolean {
    return !!(
      this.revenueChartRef?.nativeElement &&
      this.orderStatusChartRef?.nativeElement &&
      this.productSalesChartRef?.nativeElement &&
      this.customerSpendingChartRef?.nativeElement &&
      this.monthlyTrendsChartRef?.nativeElement
    );
  }

  // Add a method to check if data is available
  private hasData(): boolean {
    return (
      (this.dailyOrderStats && this.dailyOrderStats.length > 0) ||
      (this.monthlyOrderStats && this.monthlyOrderStats.length > 0) ||
      (this.orderStatusDistribution && this.orderStatusDistribution.length > 0) ||
      (this.productSalesStats && this.productSalesStats.length > 0) ||
      (this.topCustomers && this.topCustomers.length > 0)
    );
  }

  // Helper methods for UI
  formatCurrency(value: number | undefined): string {
    if (value === undefined || value === null) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }

  formatNumber(value: number | undefined): string {
    if (value === undefined || value === null) return '0';
    return new Intl.NumberFormat().format(value);
  }

  formatPercentage(value: number | undefined): string {
    if (value === undefined) return '0%';
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }) + '%';
  }

  getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'primary';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'danger';
      case 'refunded':
        return 'info';
      default:
        return 'secondary';
    }
  }

  refreshData(): void {
    this.loadAnalyticsData();
  }
}

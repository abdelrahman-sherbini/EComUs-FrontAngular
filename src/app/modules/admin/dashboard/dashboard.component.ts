import {Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router, RouterModule} from '@angular/router';
import {FormBuilder, FormGroup, Validators, ReactiveFormsModule} from '@angular/forms';
import {
  AdminStatisticsService,
  AdminStatisticsServiceInterface,
  DashboardSummaryProjection,
  OrderStatusDistributionProjection,
  RecentOrderProjection,
  TopSellingProductProjection,
  AdminProductsService,
  AdminCategoriesService,
  NewProductDTO,
  CategoryDTO,
  CategoryNameDTO, OrderDTO, AdminOrdersService, OrderStatusDTO
} from '../../openapi';
import {catchError, forkJoin, Observable, of, Subject, takeUntil, finalize} from 'rxjs';
import {ToastService} from '../../../services/toast';

// Chart.js imports
declare var Chart: any;

interface ImagePreview {
  file: File;
  preview: string;
}

interface RevenueDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @ViewChild('revenueChart', { static: false }) revenueChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusChart', { static: false }) statusChartRef!: ElementRef<HTMLCanvasElement>;
  selectedOrder: OrderDTO | null = null;
  // Dashboard data
  dashboardData: DashboardSummaryProjection | null = null;
  recentOrders: RecentOrderProjection[] = [];
  topProducts: TopSellingProductProjection[] = [];
  orderStatusDistribution: OrderStatusDistributionProjection[] = [];

  // Chart instances
  revenueChart: any;
  statusChart: any;

  // Chart data
  revenueData: RevenueDataPoint[] = [];
  selectedPeriod: string = 'week';
  chartLoading = false;
  currentPeriodRevenue = 0;
  previousPeriodRevenue = 0;
  revenueChangePercentage = 0;

  // Loading states
  isLoading = true;
  error: string | null = null;

  // Product form
  productForm: FormGroup;
  availableCategories: CategoryDTO[] = [];
  selectedCategories: number[] = [];
  selectedImages: ImagePreview[] = [];
  categoriesLoading = false;
  isSubmittingProduct = false;

  // Add a property to track revenue chart loading specifically
  revenueChartLoading = false;

  constructor(
    private router: Router,
    private adminStatsService: AdminStatisticsService,
    private adminProductsService: AdminProductsService,
    private adminCategoriesService: AdminCategoriesService,
    private formBuilder: FormBuilder,
    private ordersService: AdminOrdersService,
    private toastService: ToastService,
  ) {
    this.productForm = this.formBuilder.group({
      productName: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      price: [0, [Validators.required, Validators.min(0.01)]],
      quantity: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    // Load data only once
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    // Wait for view to be ready, then check if we need to initialize charts
    setTimeout(() => {
      if (!this.revenueChart && this.revenueChartRef && this.revenueData.length > 0) {
        this.createRevenueChart();
      }

      if (!this.statusChart && this.statusChartRef && this.orderStatusDistribution?.length > 0) {
        this.createStatusChart();
      }
    }, 100);
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Properly destroy chart instances to prevent memory leaks
    if (this.revenueChart) {
      this.revenueChart.destroy();
    }

    if (this.statusChart) {
      this.statusChart.destroy();
    }
  }

  loadDashboardData(): void {
    this.loadCategories();
    this.isLoading = true;
    this.error = null;
    this.chartLoading = true; // Set chart loading state

    console.log("Loading dashboard data...");

    const dashboardRequests = forkJoin({
      summary: this.adminStatsService.getDashboardSummary().pipe(
        catchError(err => {
          this.toastService.showError('Error loading dashboard summary:', err);
          return of(null);
        })
      ),
      recentOrders: this.adminStatsService.getRecentOrders(5).pipe(
        catchError(err => {
          this.toastService.showError('Error loading recent orders:', err);
          return of([]);
        })
      ),
      topProducts: this.adminStatsService.getTopSellingProducts(5).pipe(
        catchError(err => {
          this.toastService.showError('Error loading top products:', err);
          return of([]);
        })
      ),
      orderStatus: this.adminStatsService.getOrderStatusDistribution().pipe(
        catchError(err => {
          this.toastService.showError('Error loading order status distribution:', err);
          return of([]);
        })
      )
    });

    dashboardRequests.subscribe({
      next: (data: {
        summary: DashboardSummaryProjection | null,
        recentOrders: RecentOrderProjection[],
        topProducts: TopSellingProductProjection[],
        orderStatus: OrderStatusDistributionProjection[]
      }) => {
        console.log('Dashboard data loaded:', data);
        this.dashboardData = data.summary;
        this.recentOrders = data.recentOrders;
        this.topProducts = data.topProducts;
        this.orderStatusDistribution = data.orderStatus;

        // After all data is loaded, load chart data
        this.loadChartData(this.selectedPeriod);

        // Set loading state to false after data is loaded
        this.isLoading = false;
      },
      error: (error) => {
        this.toastService.showError('Error loading dashboard data:', error);
        this.error = 'Failed to load dashboard data. Please try again.';
        this.chartLoading = false;
        this.isLoading = false;
      }
    });
  }

  loadCategories(): void {
    this.categoriesLoading = true;
    this.adminCategoriesService.getCategories().subscribe({
      next: (categories) => {
        this.availableCategories = categories;
        this.categoriesLoading = false;
      },
      error: (error) => {
        this.toastService.showError('Error loading categories:', error);
        this.categoriesLoading = false;
      }
    });
  }

  loadChartData(period: string): void {
    this.chartLoading = true;

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
      catchError(err => {
        this.toastService.showError(`Error loading ${period} chart data:`, err);
        this.chartLoading = false;
        return of([]);
      }),
      finalize(() => {
        this.chartLoading = false;
      })
    ).subscribe({
      next: (data: any[]) => {
        console.log(`${period} chart data loaded:`, data);

        // Transform the API data to your RevenueDataPoint format
        this.revenueData = this.transformApiDataToChartData(data, period);

        // Calculate current and previous period revenue
        this.currentPeriodRevenue = this.revenueData.reduce((sum, item) => sum + item.revenue, 0);

        // Load previous period data for comparison
        this.loadPreviousPeriodData(period);

        // Initialize or update charts
        if (!this.revenueChart && this.revenueChartRef) {
          this.createRevenueChart();
        } else if (this.revenueChart) {
          this.updateRevenueChart();
        }

        if (!this.statusChart && this.statusChartRef && this.orderStatusDistribution?.length > 0) {
          this.createStatusChart();
        } else if (this.statusChart) {
          this.updateStatusChart();
        }
      },
      error: (error) => {
        this.toastService.showError(`Error loading ${period} chart data:`, error);
      }
    });
  }

// Helper method to transform API data to chart format
  private transformApiDataToChartData(apiData: any[], period: string): RevenueDataPoint[] {
    if (!apiData || apiData.length === 0) {
      console.warn('No API data to transform for chart');
      return [];
    }

    console.log('Transforming API data for period:', period, apiData);

    let result: RevenueDataPoint[] = [];

    if (period === 'year') {
      // For yearly data (MonthlyOrderStatsProjection)
      result = apiData.map(item => ({
        date: `${item.year}-${String(item.month).padStart(2, '0')}-01`,
        revenue: Number(item.monthlyRevenue || 0),
        orders: Number(item.orderCount || 0)
      }));
    } else {
      // For week/month data (DailyOrderStatsProjection)
      result = apiData.map(item => ({
        date: item.orderDate,
        revenue: Number(item.dailyRevenue || 0),
        orders: Number(item.orderCount || 0)
      }));
    }

    // Sort by date to ensure proper order
    result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    console.log('Transformed chart data:', result);
    return result;
  }

// Load previous period data for comparison
  private loadPreviousPeriodData(period: string): void {
    // Calculate previous period dates
    const now = new Date();
    let startDate: string;
    let endDate: string;

    switch (period) {
      case 'week':
        // Previous week
        const lastWeekEnd = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const lastWeekStart = new Date(lastWeekEnd.getTime() - 6 * 24 * 60 * 60 * 1000);
        startDate = lastWeekStart.toISOString().split('T')[0];
        endDate = lastWeekEnd.toISOString().split('T')[0];
        break;
      case 'month':
        // Previous month
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        startDate = lastMonth.toISOString().split('T')[0];
        endDate = lastMonthEnd.toISOString().split('T')[0];
        break;
      case 'year':
        // Previous year
        const lastYear = new Date(now.getFullYear() - 1, 0, 1);
        const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);
        startDate = lastYear.toISOString().split('T')[0];
        endDate = lastYearEnd.toISOString().split('T')[0];
        break;
      default:
        startDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        endDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }

    // Use the getRevenueByPeriod API for previous period comparison
    this.adminStatsService.getRevenueByPeriod(startDate, endDate).pipe(
      catchError(err => {
        this.toastService.showError('Error loading previous period data:', err);
        return of([]);
      })
    ).subscribe({
      next: (previousData) => {
        this.previousPeriodRevenue = previousData.reduce((sum, item) => sum + Number(item.revenue || 0), 0);
        this.revenueChangePercentage = this.previousPeriodRevenue > 0
          ? ((this.currentPeriodRevenue - this.previousPeriodRevenue) / this.previousPeriodRevenue) * 100
          : 0;
      }
    });
  }

// Also update your period-specific methods to work with the real APIs
  private loadWeeklyData(): void {
    this.adminStatsService.getLastWeekOrderStats().subscribe({
      next: (data) => {
        console.log('Weekly data loaded:', data);
        // Process the weekly data as needed
      },
      error: (error) => {
        this.toastService.showError('Error loading weekly data:', error);
      }
    });
  }

  private loadMonthlyData(): void {
    this.adminStatsService.getLastMonthOrderStats().subscribe({
      next: (data) => {
        console.log('Monthly data loaded:', data);
        // Process the monthly data as needed
      },
      error: (error) => {
        this.toastService.showError('Error loading monthly data:', error);
      }
    });
  }

  private loadYearlyData(): void {
    this.adminStatsService.getLastYearOrderStats().subscribe({
      next: (data) => {
        console.log('Yearly data loaded:', data);
        // Process the yearly data as needed
      },
      error: (error) => {
        this.toastService.showError('Error loading yearly data:', error);
      }
    });
  }

  initializeCharts(): void {
    console.log('Initializing charts with refs:',
      !!this.revenueChartRef,
      !!this.statusChartRef,
      'Status data length:', this.orderStatusDistribution?.length);

    if (this.revenueChartRef) {
      this.createRevenueChart();
    }

    if (this.statusChartRef && this.orderStatusDistribution?.length > 0) {
      this.createStatusChart();
    }
  }

  createRevenueChart(): void {
    const ctx = this.revenueChartRef?.nativeElement?.getContext('2d');
    if (!ctx) {
      console.error('Could not get 2D context for revenue chart');
      return;
    }

    // Log the data being used for the chart
    console.log('Revenue chart data:', {
      labels: this.revenueData.map(item => new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      values: this.revenueData.map(item => item.revenue)
    });

    this.revenueChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.revenueData.map(item =>
          new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        ),
        datasets: [{
          label: 'Revenue',
          data: this.revenueData.map(item => item.revenue),
          borderColor: '#0d6efd',
          backgroundColor: 'rgba(13, 110, 253, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#0d6efd',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8
        }, {
          label: 'Orders',
          data: this.revenueData.map(item => item.orders),
          borderColor: '#198754',
          backgroundColor: 'rgba(25, 135, 84, 0)',
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          pointBackgroundColor: '#198754',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
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
            borderColor: '#0d6efd',
            borderWidth: 1,
            callbacks: {
              label: (context: any) => {
                const dataPoint = this.revenueData[context.dataIndex];
                if (context.dataset.label === 'Revenue') {
                  return `Revenue: ${this.formatCurrency(context.parsed.y)}`;
                } else {
                  return `Orders: ${dataPoint?.orders || 0}`;
                }
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
              callback: (value: any) => this.formatCurrency(value)
            }
          },
          y1: {
            position: 'right',
            beginAtZero: true,
            grid: {
              display: false
            },
            ticks: {
              color: '#198754'
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

  createStatusChart(): void {
    const ctx = this.statusChartRef?.nativeElement?.getContext('2d');
    if (!ctx) {
      console.error('Could not get 2D context for status chart');
      return;
    }

    this.statusChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: this.orderStatusDistribution.map(item => item.status),
        datasets: [{
          data: this.orderStatusDistribution.map(item => item.count),
          backgroundColor: [
            '#28a745', // success - green
            '#ffc107', // warning - yellow
            '#dc3545', // danger - red
            '#6c757d', // secondary - gray
            '#17a2b8'  // info - blue
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const percentage = this.getOrderStatusPercentage(context.label);
                return `${context.label}: ${context.parsed} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  updateRevenueChart(): void {
    if (!this.revenueChart) {
      if (this.revenueChartRef && this.revenueData.length > 0) {
        this.createRevenueChart();
      }
      return;
    }

    if (this.revenueData.length === 0) {
      console.warn('No revenue data to update chart');
      return;
    }

    const labels = this.revenueData.map(item =>
      new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );

    // Update chart data
    this.revenueChart.data.labels = labels;
    this.revenueChart.data.datasets[0].data = this.revenueData.map(item => item.revenue);
    this.revenueChart.data.datasets[1].data = this.revenueData.map(item => item.orders);

    // Use animation for smoother transitions
    this.revenueChart.update({
      duration: 600,
      easing: 'easeOutQuad'
    });

    console.log('Revenue chart updated with data:', {
      labels,
      revenue: this.revenueData.map(item => item.revenue),
      orders: this.revenueData.map(item => item.orders)
    });
  }

  // Modify the onPeriodChange method for smoother transitions
  onPeriodChange(period: string): void {
    if (this.selectedPeriod === period) return; // Don't reload if same period

    this.selectedPeriod = period;
    this.revenueChartLoading = true; // Only set loading for the revenue chart

    // Only load the chart data for the selected period, not all dashboard data
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

    // If we have a chart already, fade it out but keep it visible
    if (this.revenueChart) {
      // Reduce opacity of existing chart during loading
      const canvas = this.revenueChartRef?.nativeElement;
      if (canvas) {
        canvas.style.opacity = '0.5';
        canvas.style.transition = 'opacity 0.3s';
      }
    }

    apiCall.pipe(
      catchError(err => {
        this.toastService.showError(`Error loading ${period} chart data:`, err);
        this.revenueChartLoading = false;
        // Restore opacity if there was an error
        const canvas = this.revenueChartRef?.nativeElement;
        if (canvas) canvas.style.opacity = '1';
        return of([]);
      }),
      finalize(() => {
        this.revenueChartLoading = false;
      })
    ).subscribe({
      next: (data: any[]) => {
        console.log(`${period} chart data loaded:`, data);

        // Transform the API data to your RevenueDataPoint format
        this.revenueData = this.transformApiDataToChartData(data, period);

        // Calculate current and previous period revenue
        this.currentPeriodRevenue = this.revenueData.reduce((sum, item) => sum + item.revenue, 0);

        // Load previous period data for comparison
        this.loadPreviousPeriodData(period);

        // Only update the revenue chart, not all charts
        this.updateRevenueChart();

        // Restore opacity with a slight delay for smooth transition
        setTimeout(() => {
          const canvas = this.revenueChartRef?.nativeElement;
          if (canvas) canvas.style.opacity = '1';
        }, 100);
      },
      error: (error) => {
        this.toastService.showError(`Error loading ${period} chart data:`, error);
        // Restore opacity if there was an error
        const canvas = this.revenueChartRef?.nativeElement;
        if (canvas) canvas.style.opacity = '1';
      }
    });
  }

  refreshData(): void {
    // Destroy existing charts to prevent duplicates
    if (this.revenueChart) {
      this.revenueChart.destroy();
      this.revenueChart = null;
    }

    if (this.statusChart) {
      this.statusChart.destroy();
      this.statusChart = null;
    }

    // Set loading states
    this.isLoading = true;
    this.chartLoading = true;

    // Load all dashboard data
    this.loadDashboardData();
  }

  exportReport(): void {
    // Implement export functionality
    console.log('Exporting report...');
    // You can implement CSV/PDF export here
  }

  retryOperation(): void {
    this.error = null;
    this.loadDashboardData();
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  openAddProductModal(): void {
    // Reset form and modal state
    this.productForm.reset();
    this.selectedCategories = [];
    this.selectedImages = [];

    // Open Bootstrap modal
    const modal = new (window as any).bootstrap.Modal(document.getElementById('addProductModal'));
    modal.show();
  }

  // Product form handlers
  onImageSelect(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Limit to 5 images
      const maxImages = 5;
      const selectedFiles = Array.from(files).slice(0, maxImages - this.selectedImages.length);

      selectedFiles.forEach((file: any) => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.selectedImages.push({
            file: file,
            preview: e.target.result
          });
        };
        reader.readAsDataURL(file);
      });
    }
  }

  removeImage(index: number): void {
    this.selectedImages.splice(index, 1);
  }

  onCategoryChange(category: CategoryDTO, event: any): void {
    if (event.target.checked) {
      this.selectedCategories.push(category.categoryId);
    } else {
      const index = this.selectedCategories.indexOf(category.categoryId);
      if (index > -1) {
        this.selectedCategories.splice(index, 1);
      }
    }
  }

  isSelectedCategory(categoryId: number): boolean {
    return this.selectedCategories.includes(categoryId);
  }

  onSubmitProduct(): void {
    if (this.productForm.valid) {
      this.isSubmittingProduct = true;

      // Prepare form data
      const formData = new FormData();

      // Prepare product data
      const productData: NewProductDTO = {
        productName: this.productForm.get('productName')?.value,
        description: this.productForm.get('description')?.value,
        price: this.productForm.get('price')?.value,
        quantity: this.productForm.get('quantity')?.value,
        categories: this.selectedCategories.map(categoryId => {
          const category = this.availableCategories.find(cat => cat.categoryId === categoryId);
          return { categoryName: category?.categoryName || '' };
        })
      };

      // Add product as JSON string
      formData.append('product', JSON.stringify(productData));

      // Add images
      this.selectedImages.forEach(imagePreview => {
        formData.append('images', imagePreview.file);
      });

      // Submit to API
      this.adminProductsService.addProduct(JSON.stringify(productData), this.selectedImages.map(img => img.file))
        .subscribe({
          next: (result) => {
            this.toastService.showSuccess('Product added successfully: '+ result.productName);
            this.isSubmittingProduct = false;

            // Close modal
            const modal = (window as any).bootstrap.Modal.getInstance(document.getElementById('addProductModal'));
            modal?.hide();

            // Reset form
            this.productForm.reset();
            this.selectedCategories = [];
            this.selectedImages = [];

            // Refresh dashboard data
            this.loadDashboardData();
          },
          error: (error) => {
            this.toastService.showError('Error adding product:', error);
            this.isSubmittingProduct = false;
            // Handle error - could show toast notification
          }
        });
    }
  }

  // Utility methods
  formatNumber(value: number | undefined): string {
    if (value === undefined || value === null) return '0';
    return new Intl.NumberFormat().format(value);
  }

  formatCurrency(value: number | undefined): string {
    if (value === undefined || value === null) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }

  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'pending': 'warning',
      'processing': 'info',
      'shipped': 'primary',
      'delivered': 'success',
      'cancelled': 'danger',
      'completed': 'success'
    };
    return statusClasses[status.toLowerCase()] || 'secondary';
  }

  getTrendIcon(percentage: number): string {
    return percentage >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down';
  }

  getOrderStatusPercentage(status: string): number {
    const totalOrders = this.orderStatusDistribution.reduce((sum, item) => sum + (item.count || 0), 0);
    const statusItem = this.orderStatusDistribution.find(item => item.status === status);
    if (!statusItem || totalOrders === 0) return 0;
    return Math.round(((statusItem.count || 0) / totalOrders) * 100);
  }

  // Getters for template
  get totalUsers(): number {
    return this.dashboardData?.totalUsers || 0;
  }

  get newCustomersThisMonth(): number {
    return this.dashboardData?.newCustomersThisMonth || 0;
  }

  get totalOrders(): number {
    return this.dashboardData?.totalOrders || 0;
  }

  get todayOrders(): number {
    return this.dashboardData?.todayOrders || 0;
  }

  get totalRevenue(): number {
    return this.dashboardData?.totalRevenue || 0;
  }

  get revenueGrowthRate(): number {
    return this.dashboardData?.revenueGrowthRate || 0;
  }

  get pendingOrders(): number {
    return this.dashboardData?.pendingOrders || 0;
  }

  public viewOrderDetails(order: number): void {
    // Load full order details if needed
    if (order) {
      this.ordersService.getOrderById1(order).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (fullOrder) => {
          this.selectedOrder = fullOrder;
        },
        error: (error) => {
          this.toastService.showError('Error loading order details:', error);
          // this.selectedOrder = order; // Fall back to basic order data
        }
      });
    } else {
      // this.selectedOrder = order;
    }
  }
  closeOrderDetails(): void {
    this.selectedOrder = null;
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  getStatusBadgeClass(status: string | undefined): string {
    const baseClass = 'badge status-badge';
    switch (status) {
      case 'PROCESSING':
        return `${baseClass} badge-warning`;
      case 'SHIPPED':
        return `${baseClass} badge-info`;
      case 'COMPLETED':
        return `${baseClass} badge-success`;
      case 'CANCELED':
        return `${baseClass} badge-danger`;
      default:
        return `${baseClass} badge-secondary`;
    }
  }

  getPaymentTypeBadgeClass(payType: string | undefined): string {
    const baseClass = 'badge payment-badge';
    switch (payType) {
      case 'CASH':
        return `${baseClass} badge-success`;
      case 'CREDIT':
        return `${baseClass} badge-primary`;
      default:
        return `${baseClass} badge-secondary`;
    }
  }

  getValidNextStatuses(currentStatus: OrderStatusDTO.StatusEnum | undefined): OrderStatusDTO.StatusEnum[]{
    switch (currentStatus) {
      case 'PROCESSING':
        return ['SHIPPED', 'CANCELED'];
      case 'SHIPPED':
        return ['COMPLETED'];
      case 'COMPLETED':
      case 'CANCELED':
        return []; // No further transitions
      default:
        return [];
    }
  }

  canTransitionTo(
    currentStatus: OrderStatusDTO.StatusEnum | undefined,
    newStatus: OrderStatusDTO.StatusEnum | undefined
  ): boolean {
    if (!currentStatus || !newStatus) return false;
    return this.getValidNextStatuses(currentStatus).includes(newStatus);
  }

  getStatusTransitionInfo(status: OrderStatusDTO.StatusEnum | undefined) {
    const statusInfo: Record<OrderStatusDTO.StatusEnum, { icon: string; color: string; label: string }> = {
      PROCESSING: { icon: 'fa-clock', color: 'text-warning', label: 'Processing' },
      SHIPPED: { icon: 'fa-shipping-fast', color: 'text-info', label: 'Shipped' },
      COMPLETED: { icon: 'fa-check-circle', color: 'text-success', label: 'Completed' },
      CANCELED: { icon: 'fa-times-circle', color: 'text-danger', label: 'Canceled' }
    };

    return status ? statusInfo[status] : { icon: 'fa-question', color: 'text-secondary', label: status };
  }

  readonly statusList: OrderStatusDTO.StatusEnum[] = [
    OrderStatusDTO.StatusEnum.Processing,
    OrderStatusDTO.StatusEnum.Shipped,
    OrderStatusDTO.StatusEnum.Completed,
    OrderStatusDTO.StatusEnum.Canceled
  ];
  updateOrderStatus(orderId: number, newStatus: string): void {
    const statusDto: OrderStatusDTO = {
      status: newStatus as OrderStatusDTO.StatusEnum
    };

    this.ordersService.updateOrderStatus(orderId, statusDto).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (updatedOrder) => {
        // Update the order in the current list
        const index = this.recentOrders.findIndex(o => o.orderId === orderId);
        if (index !== -1) {
          this.recentOrders[index].status = updatedOrder.status;
        }

        // Update selected order if it's the same one
        if (this.selectedOrder?.orderId === orderId) {
          this.selectedOrder = updatedOrder;
        }

        // Show success message (you might want to add a toast service)
        this.toastService.showSuccess('Order status updated successfully');
      },
      error: (error) => {
        this.toastService.showError('Error updating order status:', error);
        this.error = 'Failed to update order status. Please try again.';
      }
    });
  }

  // Add a method to check if we have valid order status data
  hasOrderStatusData(): boolean {
    return this.orderStatusDistribution && this.orderStatusDistribution.length > 0;
  }

  // Add a separate method to update the status chart
  updateStatusChart(): void {
    if (!this.statusChart) {
      if (this.statusChartRef && this.orderStatusDistribution && this.orderStatusDistribution.length > 0) {
        this.createStatusChart();
      }
      return;
    }

    if (!this.orderStatusDistribution || this.orderStatusDistribution.length === 0) {
      return;
    }

    this.statusChart.data.labels = this.orderStatusDistribution.map(item => item.status);
    this.statusChart.data.datasets[0].data = this.orderStatusDistribution.map(item => item.count);
    this.statusChart.update();
  }

}

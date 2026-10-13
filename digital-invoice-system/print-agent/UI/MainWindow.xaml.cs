using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Input;
using System.Windows.Threading;
using Newtonsoft.Json;

namespace PrintAgent.UI
{
    public partial class MainWindow : Window
    {
        private Parser.ReceiptData currentReceipt;
        private string rawPrintBytes = "";
        private DispatcherTimer autoTimer;
        private int secondsRemaining = 5;
        private bool isTimerPaused = false;
        private string apiBaseUrl = "https://bill.retailnode.in/api/v1";
        private string tenantApiToken = "sk_live_test_store_token_123";

        public MainWindow()
        {
            InitializeComponent();
            LoadMockOrInterceptedInvoice();
            SetupAutoTimer();
        }

        private void LoadMockOrInterceptedInvoice()
        {
            // In production, this receives the raw text intercepted from the spooler
            string mockSpoolText = "Store: Deepak Sarees\nAddress: X4P5+FG Mumbai, Maharashtra\nPhone: +91 79 7716 3140\nInvoice #DS-2026-8842\nGrand Total: 8800.00\nCustomer: 917977163140";
            rawPrintBytes = mockSpoolText;
            currentReceipt = Parser.InvoiceParser.ParseRawSpoolText(mockSpoolText);

            txtStoreName.Text = currentReceipt.StoreName ?? "Deepak Sarees";
            txtInvoiceNo.Text = $"Invoice: #{currentReceipt.InvoiceNumber}";
            txtBillTotal.Text = $"₹{currentReceipt.BillTotal}";
            txtMobile.Text = currentReceipt.CustomerPhone ?? "917977163140";

            if (string.IsNullOrWhiteSpace(txtMobile.Text) || txtMobile.Text == "9876543210")
            {
                txtMobile.Focus();
                txtMobile.SelectAll();
            }
        }

        private void SetupAutoTimer()
        {
            autoTimer = new DispatcherTimer
            {
                Interval = TimeSpan.FromSeconds(1)
            };
            autoTimer.Tick += AutoTimer_Tick;
            autoTimer.Start();
        }

        private void AutoTimer_Tick(object sender, EventArgs e)
        {
            if (isTimerPaused) return;

            secondsRemaining--;
            if (secondsRemaining <= 0)
            {
                autoTimer.Stop();
                // Execute Default: Option 3 (Both Channels)
                btnBothChannels_Click(this, new RoutedEventArgs());
            }
            else
            {
                txtTimer.Text = $"Auto-executing default [Both Channels] in {secondsRemaining}s... (Press Space to pause)";
            }
        }

        // =========================================================
        // 1. SEND DIGITALLY (WhatsApp Only - Saves Paper)
        // =========================================================
        private async void btnSendDigital_Click(object sender, RoutedEventArgs e)
        {
            autoTimer?.Stop();
            btnSendDigital.IsEnabled = false;

            await SyncToBackendAsync();
            
            // Physical printing is skipped! Paper saved.
            this.Close();
        }

        // =========================================================
        // 2. SEND TO PRINTER (Physical Paper Only - No WhatsApp)
        // =========================================================
        private void btnPrintOnly_Click(object sender, RoutedEventArgs e)
        {
            autoTimer?.Stop();
            btnPrintOnly.IsEnabled = false;

            // Forward directly to physical POS thermal printer
            ForwardToPhysicalPrinter();

            // Cloud sync skipped!
            this.Close();
        }

        // =========================================================
        // 3. SEND ON BOTH CHANNELS (WhatsApp + Paper Print)
        // =========================================================
        private async void btnBothChannels_Click(object sender, RoutedEventArgs e)
        {
            autoTimer?.Stop();
            btnBothChannels.IsEnabled = false;

            // 1. Forward to physical printer immediately for zero counter lag
            ForwardToPhysicalPrinter();

            // 2. Upload to Cloud for instant WhatsApp delivery
            await SyncToBackendAsync();

            this.Close();
        }

        private async Task SyncToBackendAsync()
        {
            try
            {
                using (var client = new HttpClient())
                {
                    client.Timeout = TimeSpan.FromSeconds(3);
                    currentReceipt.CustomerPhone = txtMobile.Text.Trim();

                    var payload = new
                    {
                        receiptData = currentReceipt
                    };

                    var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
                    client.DefaultRequestHeaders.Add("X-API-Token", tenantApiToken);

                    var response = await client.PostAsync($"{apiBaseUrl}/invoices/upload", content);
                    if (!response.IsSuccessStatusCode)
                    {
                        // Fallback log or alert
                        System.Diagnostics.Debug.WriteLine($"Upload returned: {response.StatusCode}");
                    }
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Cloud Sync Error: {ex.Message}");
            }
        }

        private void ForwardToPhysicalPrinter()
        {
            try
            {
                // In production, uses Winspool API RawPrinterHelper.SendStringToPrinter(printerName, rawPrintBytes)
                System.Diagnostics.Debug.WriteLine($"[Physical Print Job Dispatched]: {rawPrintBytes.Length} bytes sent to local printer.");
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Print Spool Error: {ex.Message}");
            }
        }

        // =========================================================
        // KEYBOARD SHORTCUTS FOR RAPID CASHIER OPERATION
        // =========================================================
        private void Window_PreviewKeyDown(object sender, KeyEventArgs e)
        {
            // If typing in the mobile textbox, only intercept Enter/Escape
            if (txtMobile.IsFocused && e.Key != Key.Enter && e.Key != Key.Escape)
            {
                isTimerPaused = true;
                txtTimer.Text = "Timer paused (Cashier editing phone)";
                return;
            }

            if (e.Key == Key.D1 || e.Key == Key.NumPad1 || e.Key == Key.D)
            {
                e.Handled = true;
                btnSendDigital_Click(this, new RoutedEventArgs());
            }
            else if (e.Key == Key.D2 || e.Key == Key.NumPad2 || e.Key == Key.P)
            {
                e.Handled = true;
                btnPrintOnly_Click(this, new RoutedEventArgs());
            }
            else if (e.Key == Key.D3 || e.Key == Key.NumPad3 || e.Key == Key.B || e.Key == Key.Enter)
            {
                e.Handled = true;
                btnBothChannels_Click(this, new RoutedEventArgs());
            }
            else if (e.Key == Key.Escape)
            {
                e.Handled = true;
                autoTimer?.Stop();
                this.Close();
            }
            else if (e.Key == Key.Space)
            {
                e.Handled = true;
                isTimerPaused = !isTimerPaused;
                txtTimer.Text = isTimerPaused ? "Timer paused. (Press Space to resume)" : $"Resumed: {secondsRemaining}s...";
            }
        }

        private void txtMobile_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.Enter)
            {
                e.Handled = true;
                btnBothChannels_Click(this, new RoutedEventArgs());
            }
        }
    }
}

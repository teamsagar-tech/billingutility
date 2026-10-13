using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using Newtonsoft.Json;

namespace PrintAgent.UI
{
    public partial class MainWindow : Window
    {
        private Parser.ReceiptData currentReceipt;

        public MainWindow()
        {
            InitializeComponent();
            SimulateSpoolInterception();
        }

        private void SimulateSpoolInterception()
        {
            string mockSpoolText = "Invoice #INV-98765\nGrand Total: 1540.50\nCustomer: +919876543210";
            currentReceipt = Parser.InvoiceParser.ParseRawSpoolText(mockSpoolText);
            
            txtMobile.Text = currentReceipt.CustomerPhone;
            txtBillInfo.Text = $"Bill Total: {currentReceipt.BillTotal} | Invoice: {currentReceipt.InvoiceNumber}";
        }

        private async void btnSendDigital_Click(object sender, RoutedEventArgs e)
        {
            await SyncToBackendAsync();
            MessageBox.Show("Digital Bill Sent Successfully via WhatsApp!", "Success", MessageBoxButton.OK, MessageBoxImage.Information);
            this.Close();
        }

        private async void btnSendAndPrint_Click(object sender, RoutedEventArgs e)
        {
            await SyncToBackendAsync();
            MessageBox.Show("Digital Bill Sent & Sent to Physical Printer!", "Success", MessageBoxButton.OK, MessageBoxImage.Information);
            this.Close();
        }

        private async Task SyncToBackendAsync()
        {
            try
            {
                using (var client = new HttpClient())
                {
                    // Update phone if cashier changed it in the UI
                    currentReceipt.CustomerPhone = txtMobile.Text;

                    var payload = new
                    {
                        receiptData = currentReceipt
                    };

                    var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
                    
                    // Add SaaS API Token Header
                    client.DefaultRequestHeaders.Add("X-API-Token", txtApiToken.Text);
                    
                    // Sending to our local Node.js SaaS backend
                    var response = await client.PostAsync("http://localhost:4000/api/v1/invoices/upload", content);
                    response.EnsureSuccessStatusCode();
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Failed to sync to cloud: {ex.Message}", "Sync Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }
    }
}

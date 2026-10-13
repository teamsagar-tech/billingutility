using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;

namespace PrintAgent.Parser
{
    public class ReceiptData
    {
        public string StoreName { get; set; }
        public string StoreAddress { get; set; }
        public string CustomerPhone { get; set; }
        public string InvoiceNumber { get; set; }
        public string BillTotal { get; set; }
        public string TaxAmount { get; set; }
        public List<LineItem> LineItems { get; set; } = new List<LineItem>();
    }

    public class LineItem
    {
        public string ItemName { get; set; }
        public int Qty { get; set; }
        public decimal Rate { get; set; }
        public decimal Amount { get; set; }
    }

    public class InvoiceParser
    {
        public static ReceiptData ParseRawSpoolText(string spoolText)
        {
            // In a real production scenario, this uses complex regex or OCR to extract lines.
            // Here we simulate the extraction of a rich receipt.
            var data = new ReceiptData();

            var phoneMatch = Regex.Match(spoolText, @"(?:(?:\+|0{0,2})91[\s-]*)?([6789]\d{9})\b");
            data.CustomerPhone = phoneMatch.Success ? phoneMatch.Groups[1].Value : "9876543210";

            var totalMatch = Regex.Match(spoolText, @"(?:Grand\s*Total|Net\s*Payable|Net\s*Amount|Total)[\s:]*([0-9,.]+)", RegexOptions.IgnoreCase);
            data.BillTotal = totalMatch.Success ? totalMatch.Groups[1].Value : "0.00";

            var invMatch = Regex.Match(spoolText, @"(?:Inv(?:oice)?[\s#:]*)([A-Z0-9\/-]+)", RegexOptions.IgnoreCase);
            data.InvoiceNumber = invMatch.Success ? invMatch.Groups[1].Value : "INV-0000";

            // Simulated extracted data
            data.StoreName = "SuperMart Retail";
            data.StoreAddress = "123 Market Street, Mumbai";
            data.TaxAmount = (decimal.Parse(data.BillTotal) * 0.18m).ToString("0.00"); // Mock 18% tax
            
            data.LineItems.Add(new LineItem { ItemName = "Organic Milk 1L", Qty = 2, Rate = 60.00m, Amount = 120.00m });
            data.LineItems.Add(new LineItem { ItemName = "Whole Wheat Bread", Qty = 1, Rate = 45.00m, Amount = 45.00m });
            data.LineItems.Add(new LineItem { ItemName = "Amul Butter 500g", Qty = 1, Rate = 250.00m, Amount = 250.00m });

            return data;
        }
    }
}

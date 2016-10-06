using System;
using System.IO;

using System.Data;

using FastReport;
using System.Net;
using System.Runtime.Serialization;
using System.Runtime.Serialization.Json;
using Newtonsoft.Json;

namespace PrintModule
{
    [DataContract]
    public class PrintJob
    {
        [DataMember(Order = 0, IsRequired = true)]
        public int PrintQueueID { get; set; }

        [DataMember(Order = 1)]
        public string PrintQueueName { get; set; }

        [DataMember(Order = 2)]
        public string OutPortCmd { get; set; }

        [DataMember(Order = 3)]
        public string Direction { get; set; }

        [DataMember(Order = 4)]
        public string PrintFileName { get; set; }

        [DataMember(Order = 5)]
        public int Count { get; set; }

        [DataMember(Order = 6)]
        public decimal Weight { get; set; }

        [DataMember(Order = 7)]
        public string SerialNumber { get; set; }

        [DataMember(Order = 8)]
        public string baggingBatchNumber { get; set; }

        [DataMember(Order = 9)]
        public string mailBagNumber { get; set; }

        [DataMember(Order = 10)]
        public string sortingCode { get; set; }

        [DataMember(Order = 11)]
        public string barcodeContent { get; set; }

        [DataMember(Order = 12)]
        public string CountryCode { get; set; }

        [DataMember(Order = 13)]
        public string ErrorMsg { get; set; }

        [DataMember(Order = 14)]
        public string PrintFlag { get; set; }

        [DataMember(Order = 15)]
        public string CreateDate { get; set; }
        
    }
    class BFSortPrint
    {
        string serverAddr = "http://115.159.200.254:27406/autoSorting/PrintJob";
        string defaultPrintFile = "PrintFile1.frx";
        Boolean isPrinting;
        PrintJob job;
        Report FReport;
        DataSet data;
        string err;

        public string GetPrintFile(string printFielName)
        {
            string myDir = System.IO.Directory.GetCurrentDirectory();
            return myDir + "\\PrintFile\\" + printFielName;
        }

        public Boolean GetPrintJob()
        {
            try {
                HttpWebRequest req = (HttpWebRequest)HttpWebRequest.Create(serverAddr);
                req.Method = "GET";
                using (WebResponse wr = req.GetResponse())
                {
                    DataContractJsonSerializer serializer = new DataContractJsonSerializer(typeof(PrintJob));
                    //job = (PrintJob)(serializer.ReadObject(wr.GetResponseStream()));
                    StreamReader sr=new StreamReader(wr.GetResponseStream());
                    string json = sr.ReadToEnd();
                    data = JsonConvert.DeserializeObject<DataSet>(json);
                    //在这里对接收到的页面内容进行处理
                }
                return true;
            }catch (Exception e){
                err = (e.StackTrace);
            }
            return false;
        }
        public Boolean DoPrint()
        {
            FReport = new Report();
            try {
                long queueId = (long)data.Tables[0].Rows[0]["PrintQueueID"];
                string printFileName = (string)data.Tables[0].Rows[0]["PrintFileName"];
                if (printFileName!= null && printFileName.Length > 0)
                    FReport.Load(GetPrintFile(printFileName));
                else
                    FReport.Load(GetPrintFile(defaultPrintFile));

                FReport.RegisterData(data, "Ba_PrintQueue");
                //FReport.Design();
                FReport.Prepare();
                FReport.PrintSettings.ShowDialog = false;
                FReport.PrintSettings.Printer = "Adobe PDF";
                FReport.Print();

            }
            catch (Exception e)
            { }
            /*
            DataSet ds=new DataSet();
            DataTable dt = new DataTable();
            dt.TableName = "Ba_PrintQueue";
            ds.Tables.Add(dt);
            dt.Columns.Add("PrintQueueID", typeof(int));
            dt.Columns.Add("Weight", typeof(decimal));
            DataRow row = dt.NewRow();
            row["PrintQueueID"] = job.PrintQueueID;
            row["Weight"] = job.Weight;
            dt.Rows.Add(row);
            

            //string a=JsonConvert.SerializeObject(ds);

            //FReport.RegisterData(ds, "Ba_PrintQueue");
            FReport.RegisterData(data, "Ba_PrintQueue");
            //FReport.Design();
            FReport.Prepare();
            FReport.PrintSettings.ShowDialog = false;
            FReport.PrintSettings.Printer = "Adobe PDF";
            //FReport.PrintSettings.PrintToFile = true;
            //FReport.PrintSettings.PrintToFileName = "3.pdf";
            
            //FReport.Show();
            FReport.Print();
            */
            return false;
        }
    }
}

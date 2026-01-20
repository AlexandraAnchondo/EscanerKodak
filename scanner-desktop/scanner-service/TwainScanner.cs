using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Threading;
using System.Windows.Forms;
using TwainDotNet;
using TwainDotNet.WinFroms;

public static class TwainScanner
{
    private static readonly object _scanLock = new object();

    // Lista de escáneres disponibles
    public static List<string> ListScanners()
    {
        List<string> scanners = null;

        var thread = new Thread(() =>
        {
            using (var form = new Form()) // Formulario invisible para message loop
            {
                form.ShowInTaskbar = false;
                form.WindowState = FormWindowState.Minimized;

                var twain = new Twain(new WinFormsWindowMessageHook(form));
                scanners = twain.SourceNames.ToList();
            }
        });

        thread.SetApartmentState(ApartmentState.STA); // Importante para TWAIN
        thread.Start();
        thread.Join();

        return scanners ?? new List<string>();
    }

    // Escanea a JPEG usando hilo STA
    public static string ScanToJpeg(string scannerName)
    {
        string path = null;

        var thread = new Thread(() =>
        {
            using (var form = new Form())
            {
                form.ShowInTaskbar = false;
                form.WindowState = FormWindowState.Minimized;

                var twain = new Twain(new WinFormsWindowMessageHook(form));

                if (!twain.SourceNames.Contains(scannerName))
                    throw new Exception("Scanner no encontrado");

                Image scannedImage = null;

                // Evento para capturar la imagen escaneada
                twain.TransferImage += (s, e) =>
                {
                    lock (_scanLock)
                    {
                        scannedImage = e.Image;
                    }
                };

                // Configuración del escaneo
                var settings = new TwainDotNet.ScanSettings()
                {
                    UseDocumentFeeder = true,
                    ShowTwainUI = false,
                    ShowProgressIndicatorUI = false,
                    UseDuplex = true,
                    Resolution = ResolutionSettings.ColourPhotocopier,
                    Area = null,
                    ShouldTransferAllPages = true
                };

                twain.SelectSource(scannerName);

                // Ejecutar el message loop y el escaneo
                form.Load += (s, e) => twain.StartScanning(settings);
                Application.Run(form);

                // Guardar la imagen una vez que se captura
                if (scannedImage != null)
                {
                    Directory.CreateDirectory("scans");
                    path = Path.Combine("scans", $"scan_{Guid.NewGuid()}.jpg");
                    scannedImage.Save(path, ImageFormat.Jpeg);
                    scannedImage.Dispose();
                }
                else
                {
                    throw new Exception("No se escaneó ninguna imagen.");
                }
            }
        });

        thread.SetApartmentState(ApartmentState.STA);
        thread.Start();
        thread.Join(); // Esperar a que termine el hilo de escaneo

        return path;
    }
}

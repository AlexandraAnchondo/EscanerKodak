using System;
using System.Text;
using Dynarithmic;

namespace Test
{
    class Program
    {
        static void Main(string[] args)
        {
            IntPtr hTwain = TwainAPI.DTWAIN_SysInitialize();

            if (hTwain == IntPtr.Zero)
            {
                Console.WriteLine("❌ No se pudo inicializar DTWAIN");
                return;
            }

            Console.WriteLine("✅ DTWAIN inicializado");

            IntPtr source = TwainAPI.DTWAIN_SelectSource();
            if (source == IntPtr.Zero)
            {
                Console.WriteLine("❌ No se seleccionó escáner");
                TwainAPI.DTWAIN_SysDestroy();
                return;
            }

            StringBuilder name = new StringBuilder(256);
            TwainAPI.DTWAIN_GetSourceProductNameA(source, name, 256);
            Console.WriteLine("📠 Escáner: " + name);

            int minusOne = -1;
            int status = 0;

            TwainAPI.DTWAIN_EnableAutoFeed(source, 1);

            TwainAPI.DTWAIN_SetCapValues(
                source,
                TwainAPI.DTWAIN_CV_CAPXFERCOUNT,
                TwainAPI.DTWAIN_CAPSET,
                TwainAPI.DTWAIN_ARRAYLONG
            );

            int result = TwainAPI.DTWAIN_AcquireFile(
                source,
                "Test.pdf",
                TwainAPI.DTWAIN_PDFMULTI,
                TwainAPI.DTWAIN_USENATIVE | TwainAPI.DTWAIN_USENAME,
                TwainAPI.DTWAIN_PT_DEFAULT,
                -1,   // max pages
                0,    // ❌ SIN UI
                1,
                ref status
            );

            Console.WriteLine($"Result={result}, Status={status}");

            Console.WriteLine("Resultado función: " + result);
            Console.WriteLine("Status: " + status);

            if (result == 1 && status == 1)
                Console.WriteLine("✅ Escaneo realizado correctamente");
            else
                Console.WriteLine("❌ El escaneo falló o fue cancelado");


            TwainAPI.DTWAIN_SysDestroy();
            Console.WriteLine("DTWAIN liberado");
        }
    }
}

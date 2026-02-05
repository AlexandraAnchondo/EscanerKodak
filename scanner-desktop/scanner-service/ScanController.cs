using Dynarithmic;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("scan")]
public class ScanController : ControllerBase
{
    [HttpPost]
    public IActionResult Scan([FromBody] ScanRequest request)
    {
        string fileName = $"scan_{DateTime.Now.Ticks}.pdf";
        string filePath = Path.Combine("Files", fileName);

        Directory.CreateDirectory("Files");

        IntPtr hTwain = TwainAPI.DTWAIN_SysInitialize();
        if (hTwain == IntPtr.Zero)
            return BadRequest(new { error = true, message = "No se pudo inicializar DTWAIN" });

        IntPtr source = TwainAPI.DTWAIN_SelectSource();
        if (source == IntPtr.Zero)
        {
            TwainAPI.DTWAIN_SysDestroy();
            return BadRequest(new { error = true, message = "No se seleccionó escáner" });
        }

        TwainAPI.DTWAIN_EnableAutoFeed(source, 1);

        // 🔁 Duplex según usuario
        if (request.Duplex)
        {
            if (TwainAPI.DTWAIN_IsDuplexSupported(source) == 1)
            {
                TwainAPI.DTWAIN_EnableDuplex(source, 1);

                // opcional: contar páginas como hojas físicas
                TwainAPI.DTWAIN_SetDoublePageCountOnDuplex(source, 0);
            }
        }
        else
        {
            TwainAPI.DTWAIN_EnableDuplex(source, 0);
        }

        int pixelType = TwainAPI.DTWAIN_PT_DEFAULT;

        switch (request.ColorMode?.ToLower())
        {
            case "bw":
                pixelType = TwainAPI.DTWAIN_PT_BW;
                break;

            case "gray":
                pixelType = TwainAPI.DTWAIN_PT_GRAY;
                break;

            case "color":
                pixelType = TwainAPI.DTWAIN_PT_RGB;
                break;

            default:
                pixelType = TwainAPI.DTWAIN_PT_DEFAULT;
                break;
        }

        int status = 0;

        int result = TwainAPI.DTWAIN_AcquireFile(
            source,
            filePath,
            TwainAPI.DTWAIN_PDFMULTI,
            TwainAPI.DTWAIN_USENATIVE | TwainAPI.DTWAIN_USENAME,
            pixelType,
            -1,
            0,
            1,
            ref status
        );

        TwainAPI.DTWAIN_SysDestroy();

        if (System.IO.File.Exists(filePath))
        {
            return Ok(new
            {
                success = result == 1 && status == 1,
                file = fileName,
                result,
                status
            });
        }

        return BadRequest(new
        {
            error = true,
            message = "Escaneo fallido",
            result,
            status
        });
    }

    [HttpDelete("{file}")]
    public IActionResult Delete(string file)
    {
        var path = Path.Combine("Files", file);

        if (!System.IO.File.Exists(path))
            return NotFound();

        System.IO.File.Delete(path);
        return Ok();
    }
}

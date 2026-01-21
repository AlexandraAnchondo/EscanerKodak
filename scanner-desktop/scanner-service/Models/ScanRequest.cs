public record ScanRequest(
    string ScannerName,
    ScanSettingsDto Settings
);

public record ScanSettings(
    int Dpi
);
public class ScanSettingsDto
{
    public int Dpi { get; set; } = 300;
    public string ColorMode { get; set; } = "color"; // color | grayscale | bw
    public bool Duplex { get; set; } = true;
    public bool UseFeeder { get; set; } = true;
}

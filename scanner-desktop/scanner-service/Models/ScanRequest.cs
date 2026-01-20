public record ScanRequest(
    string ScannerName,
    ScanSettings? Settings
);

public record ScanSettings(
    int Dpi
);

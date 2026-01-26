using System.Text.Json;

public static class ScannerStore
{
    private static readonly string FilePath =
        Path.Combine(AppContext.BaseDirectory, "scanner.json");

    public static void Save(string scannerName)
    {
        File.WriteAllText(FilePath,
            JsonSerializer.Serialize(new { scannerName }));
    }

    public static string? Load()
    {
        if (!File.Exists(FilePath)) return null;

        using var doc = JsonDocument.Parse(File.ReadAllText(FilePath));
        return doc.RootElement.GetProperty("scannerName").GetString();
    }
}

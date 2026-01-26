public class ScanJob
{
    public List<string> Files { get; set; } = new();
    public string Status { get; set; } = "starting";
    public string? Error { get; set; }
}

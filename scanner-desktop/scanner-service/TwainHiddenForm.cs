using System.Windows.Forms;

public class TwainHiddenForm : Form
{
    public TwainHiddenForm()
    {
        ShowInTaskbar = false;
        WindowState = FormWindowState.Minimized;
        Visible = false;
    }
}

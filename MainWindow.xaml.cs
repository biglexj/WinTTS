using Microsoft.Win32;
using System.Speech.Synthesis;
using System.Text.RegularExpressions;
using System.Windows;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Threading;
using WinTTS.Controls;
using WinTTS.Models;
using WinTTS.Services;

namespace WinTTS;

public partial class MainWindow : Window
{
    private const int LargePasteCharacterThreshold = 1_000;
    private readonly SpeechService _speechService = new();
    private readonly AudioExportService _audioExportService = new();
    private CancellationTokenSource? _exportCancellation;
    private int _currentTextLength;
    private string _markdownSource = string.Empty;
    private bool _isUpdatingMarkdownView;

    public MainWindow()
    {
        InitializeComponent();
        _speechService.PlaybackStateChanged += SpeechService_PlaybackStateChanged;
        _speechService.ProgressChanged += SpeechService_ProgressChanged;
        _speechService.SpeechCompleted += SpeechService_SpeechCompleted;
        LoadVoices();
        UpdatePlaybackControls(PlaybackState.Idle);
        UpdateDocumentStats();
    }

    private void LoadVoices()
    {
        try
        {
            foreach (SystemVoice voice in _speechService.GetAvailableVoices())
            {
                VoiceSelector.Items.Add(voice);
            }

            if (VoiceSelector.Items.Count > 0)
            {
                VoiceSelector.SelectedIndex = 0;
            }
            else
            {
                StatusText.Text = "No se encontraron voces habilitadas en Windows.";
                PlayPauseButton.IsEnabled = false;
                ExportButton.IsEnabled = false;
            }
        }
        catch (Exception exception)
        {
            ShowError("No fue posible cargar las voces instaladas.", exception);
        }
    }

    private SpeechSettings GetSettings() => new(
        (VoiceSelector.SelectedItem as SystemVoice)?.Name,
        (int)VolumeSlider.Value,
        (int)RateSlider.Value,
        (int)PitchSlider.Value);

    private string GetPreparedDocumentText() =>
        TextPreprocessor.Prepare(NarrationDocument.GetReadableText(InputEditor.Document));

    private void PlayPause_Click(object sender, RoutedEventArgs e)
    {
        try
        {
            switch (_speechService.State)
            {
                case PlaybackState.Speaking:
                    _speechService.Pause();
                    return;
                case PlaybackState.Paused:
                    _speechService.Resume();
                    return;
            }

            StartSpeech(GetPreparedDocumentText(), "Leyendo documento");
        }
        catch (Exception exception)
        {
            ShowError("No fue posible iniciar la lectura.", exception);
        }
    }

    private void ReadSelection_Click(object sender, RoutedEventArgs e)
    {
        try
        {
            string text = TextPreprocessor.Prepare(NarrationDocument.GetReadableSelection(InputEditor));
            StartSpeech(text, "Leyendo selección");
        }
        catch (Exception exception)
        {
            ShowError("No fue posible leer la selección.", exception);
        }
    }

    private void StartSpeech(string text, string status)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            StatusText.Text = "No hay texto legible en el alcance elegido.";
            return;
        }

        _currentTextLength = text.Length;
        SpeechProgressBar.Value = 0;
        StatusText.Text = status;
        _speechService.Speak(text, GetSettings());
    }

    private void StopSpeech_Click(object sender, RoutedEventArgs e) => _speechService.Stop();

    private void SkipSelection_Click(object sender, RoutedEventArgs e)
    {
        var foreground = (Brush)FindResource("SkippedBrush");
        var background = (Brush)FindResource("SkippedBackgroundBrush");
        StatusText.Text = NarrationDocument.MarkSelectionSkipped(InputEditor, foreground, background)
            ? "La selección se omitirá en lectura y exportación."
            : "Selecciona primero el fragmento que deseas omitir.";
        UpdateDocumentStats();
    }

    private void IncludeSelection_Click(object sender, RoutedEventArgs e)
    {
        var foreground = (Brush)FindResource("TextPrimaryBrush");
        StatusText.Text = NarrationDocument.IncludeSelection(InputEditor, foreground)
            ? "La selección volverá a incluirse."
            : "Selecciona primero el fragmento que deseas incluir.";
        UpdateDocumentStats();
    }

    private void ClearSkips_Click(object sender, RoutedEventArgs e)
    {
        NarrationDocument.ClearSkips(InputEditor.Document, (Brush)FindResource("TextPrimaryBrush"));
        StatusText.Text = "Se eliminaron todas las omisiones.";
        UpdateDocumentStats();
    }

    private async void ExportWave_Click(object sender, RoutedEventArgs e)
    {
        if (_exportCancellation is not null)
        {
            _exportCancellation.Cancel();
            return;
        }

        string text = GetPreparedDocumentText();
        if (string.IsNullOrWhiteSpace(text))
        {
            StatusText.Text = "No hay texto legible para exportar.";
            return;
        }

        var dialog = new SaveFileDialog
        {
            Title = "Exportar narración WAV",
            Filter = "Audio WAV (*.wav)|*.wav",
            DefaultExt = ".wav",
            AddExtension = true,
            FileName = $"WinTTS-{DateTime.Now:yyyyMMdd-HHmm}.wav",
            OverwritePrompt = true
        };

        if (dialog.ShowDialog(this) != true)
        {
            return;
        }

        _exportCancellation = new CancellationTokenSource();
        ExportButton.Content = "Cancelar exportación";
        StatusText.Text = "Generando audio WAV…";
        SpeechProgressBar.Value = 0;
        var progress = new Progress<int>(value => SpeechProgressBar.Value = value);

        try
        {
            await _audioExportService.ExportWaveAsync(
                text,
                dialog.FileName,
                GetSettings(),
                progress,
                _exportCancellation.Token);
            StatusText.Text = $"Audio guardado: {System.IO.Path.GetFileName(dialog.FileName)}";
        }
        catch (OperationCanceledException)
        {
            StatusText.Text = "Exportación cancelada; no se conservó un archivo parcial.";
        }
        catch (Exception exception)
        {
            ShowError("No fue posible exportar el audio.", exception);
        }
        finally
        {
            _exportCancellation.Dispose();
            _exportCancellation = null;
            ExportButton.Content = "Exportar WAV";
        }
    }

    private void SpeechService_PlaybackStateChanged(object? sender, PlaybackStateChangedEventArgs e) =>
        Dispatcher.Invoke(() => UpdatePlaybackControls(e.State));

    private void SpeechService_ProgressChanged(object? sender, SpeechProgressEventArgs e) =>
        Dispatcher.Invoke(() =>
        {
            SpeechProgressBar.Value = _currentTextLength == 0
                ? 0
                : Math.Clamp((e.CharacterPosition + e.CharacterCount) * 100d / _currentTextLength, 0, 100);
            StatusText.Text = $"Leyendo: {e.Text}";
        });

    private void SpeechService_SpeechCompleted(object? sender, SpeakCompletedEventArgs e) =>
        Dispatcher.Invoke(() =>
        {
            SpeechProgressBar.Value = e.Cancelled ? 0 : 100;
            StatusText.Text = e.Error is not null
                ? $"Error de lectura: {e.Error.Message}"
                : e.Cancelled ? "Lectura detenida." : "Lectura completada.";
        });

    private void UpdatePlaybackControls(PlaybackState state)
    {
        PlayPauseButton.Content = state switch
        {
            PlaybackState.Speaking => "Pausar",
            PlaybackState.Paused => "Reanudar",
            PlaybackState.Stopping => "Deteniendo…",
            _ => "Reproducir"
        };

        PlayPauseButton.IsEnabled = state != PlaybackState.Stopping && VoiceSelector.Items.Count > 0;
        StopButton.IsEnabled = state is PlaybackState.Speaking or PlaybackState.Paused;
        StateIndicator.Fill = state switch
        {
            PlaybackState.Speaking => (Brush)FindResource("AccentBrush"),
            PlaybackState.Paused => (Brush)FindResource("SkippedBrush"),
            PlaybackState.Error => (Brush)FindResource("DangerBrush"),
            _ => (Brush)FindResource("DisabledBrush")
        };
    }

    private void VoiceSelector_SelectionChanged(object sender, System.Windows.Controls.SelectionChangedEventArgs e)
    {
        try
        {
            if (_speechService.ChangeVoice(GetSettings()))
            {
                StatusText.Text = _speechService.State == PlaybackState.Paused
                    ? "Voz cambiada; la lectura permanece pausada."
                    : "Cambiando voz…";
            }
        }
        catch (Exception exception)
        {
            ShowError("No fue posible cambiar la voz durante la lectura.", exception);
        }
    }

    private void InputEditor_TextChanged(object sender, System.Windows.Controls.TextChangedEventArgs e)
    {
        if (!_isUpdatingMarkdownView && !InputEditor.IsReadOnly)
        {
            _markdownSource = GetEditorText();
        }

        UpdateDocumentStats();
    }

    private void InputEditor_PasteCanExecute(object sender, CanExecuteRoutedEventArgs e)
    {
        try
        {
            e.CanExecute = Clipboard.ContainsText();
            e.Handled = true;
        }
        catch
        {
            e.CanExecute = false;
            e.Handled = true;
        }
    }

    private void InputEditor_PasteExecuted(object sender, ExecutedRoutedEventArgs e)
    {
        try
        {
            string pastedText = Clipboard.GetText();
            if (MarkdownPreviewToggle.IsChecked == true)
            {
                ShowMarkdownPreview(pastedText);
                StatusText.Text = "Vista Markdown renderizada.";
            }
            else
            {
                InputEditor.Selection.Text = pastedText;
                _markdownSource = GetEditorText();
                if (pastedText.Length >= LargePasteCharacterThreshold)
                {
                    ScrollEditorToStart();
                }
            }

            e.Handled = true;
        }
        catch (Exception exception)
        {
            ShowError("No fue posible pegar el contenido del portapapeles.", exception);
        }
    }

    private void MarkdownPreviewToggle_Click(object sender, RoutedEventArgs e)
    {
        if (MarkdownPreviewToggle.IsChecked == true)
        {
            if (!InputEditor.IsReadOnly)
            {
                _markdownSource = GetEditorText();
            }

            ShowMarkdownPreview(_markdownSource);
            StatusText.Text = "Vista Markdown activada.";
        }
        else
        {
            ShowMarkdownSource();
            StatusText.Text = "Vista Markdown desactivada; puedes editar la sintaxis.";
        }
    }

    private void ShowMarkdownPreview(string markdown)
    {
        _markdownSource = markdown;
        var theme = new MarkdownDocumentTheme(
            (Brush)FindResource("TextPrimaryBrush"),
            (Brush)FindResource("TextSecondaryBrush"),
            (Brush)FindResource("AccentBrush"),
            (Brush)FindResource("SurfaceRaisedBrush"),
            (Brush)FindResource("BorderBrush"));

        _isUpdatingMarkdownView = true;
        try
        {
            InputEditor.Document = MarkdownDocumentRenderer.Render(markdown, theme);
            InputEditor.IsReadOnly = true;
            System.Windows.Controls.SpellCheck.SetIsEnabled(InputEditor, false);
        }
        finally
        {
            _isUpdatingMarkdownView = false;
        }

        ScrollEditorToStart();
        UpdateDocumentStats();
    }

    private void ShowMarkdownSource()
    {
        FlowDocument document = MarkdownSourceHighlighter.Render(
            _markdownSource,
            (Brush)FindResource("TextPrimaryBrush"),
            (Brush)FindResource("SkippedBrush"),
            (Brush)FindResource("SkippedBackgroundBrush"));

        _isUpdatingMarkdownView = true;
        try
        {
            InputEditor.Document = document;
            InputEditor.IsReadOnly = false;
            System.Windows.Controls.SpellCheck.SetIsEnabled(InputEditor, true);
        }
        finally
        {
            _isUpdatingMarkdownView = false;
        }

        ScrollEditorToStart();
        UpdateDocumentStats();
    }

    private string GetEditorText() => new TextRange(
        InputEditor.Document.ContentStart,
        InputEditor.Document.ContentEnd)
        .Text
        .TrimEnd('\r', '\n');

    private void ScrollEditorToStart()
    {
        InputEditor.CaretPosition = InputEditor.Document.ContentStart;
        InputEditor.ScrollToHome();
    }

    private void UpdateDocumentStats()
    {
        if (DocumentStatsText is null || InputEditor is null)
        {
            return;
        }

        string text = TextPreprocessor.Prepare(NarrationDocument.GetReadableText(InputEditor.Document));
        int words = string.IsNullOrWhiteSpace(text)
            ? 0
            : Regex.Matches(text, @"\S+").Count;
        int minutes = words == 0 ? 0 : Math.Max(1, (int)Math.Ceiling(words / 160d));
        DocumentStatsText.Text = $"{words} palabras · ~{minutes} min";
    }

    private void ShowError(string message, Exception exception)
    {
        StatusText.Text = $"{message} {exception.Message}";
        StateIndicator.Fill = (Brush)FindResource("DangerBrush");
    }

    private void Window_PreviewKeyDown(object sender, KeyEventArgs e)
    {
        if (e.Key == Key.Enter && Keyboard.Modifiers.HasFlag(ModifierKeys.Control))
        {
            PlayPause_Click(sender, new RoutedEventArgs());
            e.Handled = true;
        }
        else if (e.Key == Key.Escape)
        {
            _speechService.Stop();
            e.Handled = true;
        }
        else if (e.Key == Key.Space && !InputEditor.IsKeyboardFocusWithin)
        {
            PlayPause_Click(sender, new RoutedEventArgs());
            e.Handled = true;
        }
    }

    private void Header_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
    {
        if (e.ClickCount == 2)
        {
            ToggleMaximize();
            return;
        }

        if (e.ButtonState == MouseButtonState.Pressed)
        {
            DragMove();
        }
    }

    private void ToggleMaximize() => WindowState =
        WindowState == WindowState.Maximized ? WindowState.Normal : WindowState.Maximized;

    private void Maximize_Click(object sender, RoutedEventArgs e) => ToggleMaximize();
    private void Minimize_Click(object sender, RoutedEventArgs e) => WindowState = WindowState.Minimized;
    private void Close_Click(object sender, RoutedEventArgs e) => Close();

    private void Window_StateChanged(object? sender, EventArgs e)
    {
        if (MaximizeIcon is null)
        {
            return;
        }

        MaximizeIcon.Data = Geometry.Parse(WindowState == WindowState.Maximized
            ? "M 5,3 L 13,3 L 13,11 M 3,5 L 11,5 L 11,13 L 3,13 Z"
            : "M 3,3 L 13,3 L 13,13 L 3,13 Z");
    }

    protected override void OnClosed(EventArgs e)
    {
        _exportCancellation?.Cancel();
        _exportCancellation?.Dispose();
        _speechService.Dispose();
        base.OnClosed(e);
    }
}

using System.Windows;
using System.Windows.Controls;
using System.Speech.Synthesis;

namespace WinTTS
{
    public partial class MainWindow : Window
    {
        private readonly SpeechService _speechService;

        public MainWindow()
        {
            InitializeComponent();
            _speechService = new SpeechService();
            
            LoadVoices();
            
            // Connect Volume slider
            VolumeSlider.ValueChanged += (s, e) => {
                _speechService.SetVolume((int)VolumeSlider.Value);
            };
        }

        private void LoadVoices()
        {
            var voices = _speechService.GetAvailableVoices();
            foreach (var voice in voices)
            {
                VoiceSelector.Items.Add(voice);
            }
            
            if (VoiceSelector.Items.Count > 0)
                VoiceSelector.SelectedIndex = 0;
        }

        private void StartSpeech_Click(object sender, RoutedEventArgs e)
        {
            string text = InputTextBox.Text;
            if (string.IsNullOrWhiteSpace(text)) return;

            string? selectedVoice = VoiceSelector.SelectedItem?.ToString();
            if (!string.IsNullOrEmpty(selectedVoice))
            {
                _speechService.SetVoice(selectedVoice);
            }

            _speechService.SetVolume((int)VolumeSlider.Value);
            _speechService.Speak(text);
        }

        private void StopSpeech_Click(object sender, RoutedEventArgs e)
        {
            _speechService.Stop();
        }

        private void VoiceSelector_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            if (_speechService == null) return;
            
            string? selectedVoice = VoiceSelector.SelectedItem?.ToString();
            if (!string.IsNullOrEmpty(selectedVoice))
            {
                // Solo auto-iniciar si ya estaba hablando
                if (_speechService.State == SynthesizerState.Speaking)
                {
                    StartSpeech_Click(this, new RoutedEventArgs());
                }
            }
        }

        private void Header_MouseLeftButtonDown(object sender, System.Windows.Input.MouseButtonEventArgs e)
        {
            if (e.ButtonState == System.Windows.Input.MouseButtonState.Pressed)
            {
                DragMove();
            }
        }

        private void Close_Click(object sender, RoutedEventArgs e)
        {
            Close();
        }

        private void Maximize_Click(object sender, RoutedEventArgs e)
        {
            if (WindowState == WindowState.Maximized)
            {
                WindowState = WindowState.Normal;
                // Update icon/text if needed, but for now just toggle
            }
            else
            {
                WindowState = WindowState.Maximized;
            }
        }

        private void Minimize_Click(object sender, RoutedEventArgs e)
        {
            WindowState = WindowState.Minimized;
        }

        protected override void OnClosed(EventArgs e)
        {
            _speechService.Dispose();
            base.OnClosed(e);
        }
    }
}
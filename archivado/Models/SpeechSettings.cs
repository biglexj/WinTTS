namespace WinTTS.Models;

public sealed record SpeechSettings(
    string? VoiceName,
    int Volume,
    int Rate,
    int Pitch);

public enum PlaybackState
{
    Idle,
    Speaking,
    Paused,
    Stopping,
    Exporting,
    Error
}

public sealed record SystemVoice(string Name, string Culture, string Gender);

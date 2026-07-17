using System.Speech.Synthesis;
using WinTTS.Models;

namespace WinTTS.Services;

public sealed class PlaybackStateChangedEventArgs(PlaybackState state) : EventArgs
{
    public PlaybackState State { get; } = state;
}

public sealed class SpeechProgressEventArgs(int characterPosition, int characterCount, string text) : EventArgs
{
    public int CharacterPosition { get; } = characterPosition;
    public int CharacterCount { get; } = characterCount;
    public string Text { get; } = text;
}

public sealed class SpeechService : IDisposable
{
    private readonly SpeechSynthesizer _synthesizer = new();
    private Prompt? _activePrompt;
    private string _activeText = string.Empty;
    private string _promptText = string.Empty;
    private int _promptOffset;
    private int _promptSearchPosition;
    private int _lastSpokenEnd;
    private PendingVoiceChange? _pendingVoiceChange;
    private bool _pauseWhenStarted;
    private bool _disposed;

    public event EventHandler<PlaybackStateChangedEventArgs>? PlaybackStateChanged;
    public event EventHandler<SpeechProgressEventArgs>? ProgressChanged;
    public event EventHandler<SpeakCompletedEventArgs>? SpeechCompleted;

    public PlaybackState State { get; private set; } = PlaybackState.Idle;

    public SpeechService()
    {
        _synthesizer.SpeakStarted += OnSpeakStarted;
        _synthesizer.SpeakProgress += OnSpeakProgress;
        _synthesizer.SpeakCompleted += OnSpeakCompleted;
    }

    public IReadOnlyList<SystemVoice> GetAvailableVoices() => _synthesizer
        .GetInstalledVoices()
        .Where(voice => voice.Enabled)
        .Select(voice => new SystemVoice(
            voice.VoiceInfo.Name,
            voice.VoiceInfo.Culture.Name,
            voice.VoiceInfo.Gender.ToString()))
        .ToList();

    public void Speak(string text, SpeechSettings settings)
    {
        ThrowIfDisposed();
        if (string.IsNullOrWhiteSpace(text))
        {
            throw new ArgumentException("No hay texto disponible para leer.", nameof(text));
        }

        CancelAllAndReleasePause();
        _pendingVoiceChange = null;
        _pauseWhenStarted = false;
        _activeText = text;
        _lastSpokenEnd = 0;
        StartPrompt(text, settings, 0, pauseWhenStarted: false);
    }

    public bool ChangeVoice(SpeechSettings settings)
    {
        ThrowIfDisposed();
        if (State is not (PlaybackState.Speaking or PlaybackState.Paused) ||
            string.IsNullOrEmpty(_activeText))
        {
            return false;
        }

        int continuationStart = Math.Clamp(_lastSpokenEnd, 0, _activeText.Length);
        while (continuationStart < _activeText.Length && char.IsWhiteSpace(_activeText[continuationStart]))
        {
            continuationStart++;
        }

        if (continuationStart >= _activeText.Length)
        {
            return false;
        }

        _pendingVoiceChange = new PendingVoiceChange(
            _activeText[continuationStart..],
            settings,
            continuationStart,
            State == PlaybackState.Paused);
        CancelAllAndReleasePause();
        return true;
    }

    public void Pause()
    {
        ThrowIfDisposed();
        if (State != PlaybackState.Speaking)
        {
            return;
        }

        _synthesizer.Pause();
        SetState(PlaybackState.Paused);
    }

    public void Resume()
    {
        ThrowIfDisposed();
        if (State != PlaybackState.Paused)
        {
            return;
        }

        _synthesizer.Resume();
        SetState(PlaybackState.Speaking);
    }

    public void Stop()
    {
        ThrowIfDisposed();
        if (State == PlaybackState.Idle)
        {
            return;
        }

        _pendingVoiceChange = null;
        _pauseWhenStarted = false;
        SetState(PlaybackState.Stopping);
        CancelAllAndReleasePause();
    }

    public static void ConfigureSynthesizer(SpeechSynthesizer synthesizer, SpeechSettings settings)
    {
        synthesizer.Volume = Math.Clamp(settings.Volume, 0, 100);
        synthesizer.Rate = Math.Clamp(settings.Rate, -10, 10);

        if (!string.IsNullOrWhiteSpace(settings.VoiceName))
        {
            synthesizer.SelectVoice(settings.VoiceName);
        }
    }

    public static string GetSelectedCulture(SpeechSynthesizer synthesizer) =>
        synthesizer.Voice?.Culture.Name ?? "es-PE";

    private void OnSpeakProgress(object? sender, SpeakProgressEventArgs e)
    {
        if (_activePrompt is not null && e.Prompt != _activePrompt)
        {
            return;
        }

        int localPosition = _promptText.IndexOf(
            e.Text,
            _promptSearchPosition,
            StringComparison.CurrentCulture);
        if (localPosition < 0)
        {
            localPosition = Math.Clamp(e.CharacterPosition, 0, _promptText.Length);
        }

        int localEnd = Math.Clamp(localPosition + e.Text.Length, 0, _promptText.Length);
        _promptSearchPosition = localEnd;
        int globalPosition = _promptOffset + localPosition;
        _lastSpokenEnd = _promptOffset + localEnd;

        ProgressChanged?.Invoke(this, new SpeechProgressEventArgs(
            globalPosition,
            localEnd - localPosition,
            e.Text));
    }

    private void OnSpeakCompleted(object? sender, SpeakCompletedEventArgs e)
    {
        if (_activePrompt is not null && e.Prompt != _activePrompt)
        {
            return;
        }

        _activePrompt = null;

        if (_pendingVoiceChange is not null)
        {
            PendingVoiceChange change = _pendingVoiceChange;
            _pendingVoiceChange = null;
            StartPrompt(change.Text, change.Settings, change.Offset, change.RemainPaused);
            return;
        }

        _activeText = string.Empty;
        _promptText = string.Empty;
        SetState(e.Error is null ? PlaybackState.Idle : PlaybackState.Error);
        SpeechCompleted?.Invoke(this, e);
    }

    private void OnSpeakStarted(object? sender, SpeakStartedEventArgs e)
    {
        if (_activePrompt is not null && e.Prompt != _activePrompt)
        {
            return;
        }

        if (_pauseWhenStarted)
        {
            _pauseWhenStarted = false;
            _synthesizer.Pause();
            SetState(PlaybackState.Paused);
            return;
        }

        SetState(PlaybackState.Speaking);
    }

    private void StartPrompt(
        string text,
        SpeechSettings settings,
        int offset,
        bool pauseWhenStarted)
    {
        ConfigureSynthesizer(_synthesizer, settings);
        _promptText = text;
        _promptOffset = offset;
        _promptSearchPosition = 0;
        _pauseWhenStarted = pauseWhenStarted;
        string culture = GetSelectedCulture(_synthesizer);
        _activePrompt = _synthesizer.SpeakSsmlAsync(
            TextPreprocessor.BuildSsml(text, culture, settings.Pitch));
    }

    private void CancelAllAndReleasePause()
    {
        bool wasPaused = _synthesizer.State == SynthesizerState.Paused;
        _synthesizer.SpeakAsyncCancelAll();
        if (wasPaused)
        {
            // System.Speech keeps the synthesizer itself paused after cancelling a
            // paused prompt. Resume lets it process the cancellation and ensures
            // the next prompt can produce audio.
            _synthesizer.Resume();
        }
    }

    private void SetState(PlaybackState state)
    {
        if (State == state)
        {
            return;
        }

        State = state;
        PlaybackStateChanged?.Invoke(this, new PlaybackStateChangedEventArgs(state));
    }

    private void ThrowIfDisposed()
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
    }

    public void Dispose()
    {
        if (_disposed)
        {
            return;
        }

        _disposed = true;
        _pendingVoiceChange = null;
        _synthesizer.SpeakAsyncCancelAll();
        _synthesizer.Dispose();
    }

    private sealed record PendingVoiceChange(
        string Text,
        SpeechSettings Settings,
        int Offset,
        bool RemainPaused);
}

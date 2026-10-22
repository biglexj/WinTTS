using System.IO;
using System.Speech.Synthesis;
using WinTTS.Models;

namespace WinTTS.Services;

public sealed class AudioExportService
{
    public async Task ExportWaveAsync(
        string text,
        string outputPath,
        SpeechSettings settings,
        IProgress<int>? progress = null,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            throw new ArgumentException("No hay texto disponible para exportar.", nameof(text));
        }

        string? directory = Path.GetDirectoryName(outputPath);
        if (string.IsNullOrWhiteSpace(directory) || !Directory.Exists(directory))
        {
            throw new DirectoryNotFoundException("La carpeta de destino no existe.");
        }

        using var synthesizer = new SpeechSynthesizer();
        SpeechService.ConfigureSynthesizer(synthesizer, settings);
        synthesizer.SetOutputToWaveFile(outputPath);

        var completion = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        EventHandler<SpeakCompletedEventArgs>? completedHandler = null;
        EventHandler<SpeakProgressEventArgs>? progressHandler = null;

        completedHandler = (_, args) =>
        {
            if (args.Error is not null)
            {
                completion.TrySetException(args.Error);
            }
            else if (args.Cancelled)
            {
                completion.TrySetCanceled(cancellationToken);
            }
            else
            {
                completion.TrySetResult();
            }
        };

        progressHandler = (_, args) =>
        {
            int percentage = text.Length == 0
                ? 0
                : Math.Clamp((args.CharacterPosition + args.CharacterCount) * 100 / text.Length, 0, 100);
            progress?.Report(percentage);
        };

        synthesizer.SpeakCompleted += completedHandler;
        synthesizer.SpeakProgress += progressHandler;

        try
        {
            using CancellationTokenRegistration registration = cancellationToken.Register(
                synthesizer.SpeakAsyncCancelAll);
            string culture = SpeechService.GetSelectedCulture(synthesizer);
            synthesizer.SpeakSsmlAsync(TextPreprocessor.BuildSsml(text, culture, settings.Pitch));
            await completion.Task.ConfigureAwait(false);
            progress?.Report(100);
        }
        catch
        {
            synthesizer.SpeakAsyncCancelAll();
            synthesizer.SetOutputToNull();

            if (File.Exists(outputPath))
            {
                File.Delete(outputPath);
            }

            throw;
        }
        finally
        {
            synthesizer.SpeakCompleted -= completedHandler;
            synthesizer.SpeakProgress -= progressHandler;
            synthesizer.SetOutputToNull();
        }
    }
}

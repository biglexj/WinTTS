using System;
using System.Collections.Generic;
using System.Linq;
using System.Speech.Synthesis;
using System.Text.RegularExpressions;

namespace WinTTS
{
    public static class MarkdownStripper
    {
        public static string Strip(string markdown)
        {
            if (string.IsNullOrWhiteSpace(markdown)) return string.Empty;

            // 1. Remove Headers (#)
            string result = Regex.Replace(markdown, @"^#+\s+", "", RegexOptions.Multiline);

            // 2. Remove Bold/Italic (** / __ / * / _)
            result = Regex.Replace(result, @"(\*\*|__)(.*?)\1", "$2");
            result = Regex.Replace(result, @"(\*|_)(.*?)\1", "$2");

            // 3. Remove Links [text](url) -> text
            result = Regex.Replace(result, @"\[(.*?)\]\(.*?\)", "$1");

            // 4. Remove Images ![alt](url) -> ""
            result = Regex.Replace(result, @"!\[.*?\]\(.*?\)", "");

            // 5. Remove Code blocks (``` or `)
            result = Regex.Replace(result, @"```[\s\S]*?```", "");
            result = Regex.Replace(result, @"`([^`]+)`", "$1");

            // 6. Remove HTML tags
            result = Regex.Replace(result, @"<[^>]*>", "");

            // 7. Remove List markers
            result = Regex.Replace(result, @"^[\s]*([-*+]|\d+\. )[\s]*", "", RegexOptions.Multiline);

            // 8. Trim and normalize whitespace
            result = Regex.Replace(result, @"\n+", "\n");
            
            return result.Trim();
        }
    }

    public class SpeechService : IDisposable
    {
        private readonly SpeechSynthesizer _synthesizer;
        private bool _disposed;

        public SynthesizerState State => _synthesizer.State;

        public SpeechService()
        {
            _synthesizer = new SpeechSynthesizer();
        }

        public void SetVolume(int volume)
        {
            _synthesizer.Volume = Math.Clamp(volume, 0, 100);
        }

        public void SetVoice(string voiceName)
        {
            try
            {
                _synthesizer.SelectVoice(voiceName);
            }
            catch (Exception)
            {
                // Fallback or log if voice not found
            }
        }

        public IEnumerable<string> GetAvailableVoices()
        {
            return _synthesizer.GetInstalledVoices()
                .Where(v => v.Enabled)
                .Select(v => v.VoiceInfo.Name);
        }

        public void Speak(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return;
            
            _synthesizer.SpeakAsyncCancelAll();
            string cleanText = MarkdownStripper.Strip(text);
            _synthesizer.SpeakAsync(cleanText);
        }

        public void Stop()
        {
            _synthesizer.SpeakAsyncCancelAll();
        }

        public void Dispose()
        {
            if (_disposed) return;
            _disposed = true;
            _synthesizer.Dispose();
        }
    }
}

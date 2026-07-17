using System.Net;
using System.Security;
using System.Text.RegularExpressions;

namespace WinTTS.Services;

public static partial class TextPreprocessor
{
    public static string Prepare(string? markdown)
    {
        if (string.IsNullOrWhiteSpace(markdown))
        {
            return string.Empty;
        }

        string result = FencedCodeRegex().Replace(markdown, string.Empty);
        result = HtmlCommentRegex().Replace(result, string.Empty);

        // Images must be removed before links; otherwise ![alt](url) becomes !alt.
        result = ImageRegex().Replace(result, string.Empty);
        result = LinkRegex().Replace(result, "$1");
        result = InlineCodeRegex().Replace(result, "$1");
        result = HtmlTagRegex().Replace(result, string.Empty);
        result = HeaderRegex().Replace(result, string.Empty);
        result = HashtagMarkerRegex().Replace(result, string.Empty);
        result = BlockQuoteRegex().Replace(result, string.Empty);
        result = ListMarkerRegex().Replace(result, string.Empty);
        result = HorizontalRuleRegex().Replace(result, string.Empty);
        result = StrongRegex().Replace(result, "$1");
        result = StrikethroughRegex().Replace(result, "$1");
        result = EmphasisAsteriskRegex().Replace(result, "$1");
        result = EmphasisUnderscoreRegex().Replace(result, "$1");
        result = MarkdownEscapeRegex().Replace(result, "$1");
        result = WebUtility.HtmlDecode(result);
        result = EmojiRegex().Replace(result, string.Empty);
        result = EmojiFormattingRegex().Replace(result, string.Empty);

        result = LineWhitespaceRegex().Replace(result, " ");
        result = RepeatedHorizontalWhitespaceRegex().Replace(result, " ");
        result = ExcessBlankLinesRegex().Replace(result, "\n\n");
        return result.Trim();
    }

    public static string BuildSsml(string text, string culture, int pitch)
    {
        string safeText = SecurityElement.Escape(text) ?? string.Empty;
        string safeCulture = SecurityElement.Escape(
            string.IsNullOrWhiteSpace(culture) ? "es-PE" : culture) ?? "es-PE";
        int safePitch = Math.Clamp(pitch, -10, 10);
        string pitchValue = safePitch > 0 ? $"+{safePitch}st" : $"{safePitch}st";

        return $"<speak version=\"1.0\" xmlns=\"http://www.w3.org/2001/10/synthesis\" xml:lang=\"{safeCulture}\"><prosody pitch=\"{pitchValue}\">{safeText}</prosody></speak>";
    }

    [GeneratedRegex(@"```[\s\S]*?```", RegexOptions.CultureInvariant)]
    private static partial Regex FencedCodeRegex();

    [GeneratedRegex(@"<!--[\s\S]*?-->", RegexOptions.CultureInvariant)]
    private static partial Regex HtmlCommentRegex();

    [GeneratedRegex(@"!\[[^\]]*\]\([^)]*\)", RegexOptions.CultureInvariant)]
    private static partial Regex ImageRegex();

    [GeneratedRegex(@"\[([^\]]+)\]\([^)]*\)", RegexOptions.CultureInvariant)]
    private static partial Regex LinkRegex();

    [GeneratedRegex(@"`([^`]+)`", RegexOptions.CultureInvariant)]
    private static partial Regex InlineCodeRegex();

    [GeneratedRegex(@"<[^>]+>", RegexOptions.CultureInvariant)]
    private static partial Regex HtmlTagRegex();

    [GeneratedRegex(@"^\s{0,3}#{1,6}\s+", RegexOptions.Multiline | RegexOptions.CultureInvariant)]
    private static partial Regex HeaderRegex();

    [GeneratedRegex(@"(?<![\w#])#+(?=[\p{L}\p{N}_])", RegexOptions.CultureInvariant)]
    private static partial Regex HashtagMarkerRegex();

    [GeneratedRegex(@"^\s{0,3}>\s?", RegexOptions.Multiline | RegexOptions.CultureInvariant)]
    private static partial Regex BlockQuoteRegex();

    [GeneratedRegex(@"^\s*(?:[-+*]|\d+[.)])\s+", RegexOptions.Multiline | RegexOptions.CultureInvariant)]
    private static partial Regex ListMarkerRegex();

    [GeneratedRegex(@"^\s{0,3}(?:[-*_]\s*){3,}$", RegexOptions.Multiline | RegexOptions.CultureInvariant)]
    private static partial Regex HorizontalRuleRegex();

    [GeneratedRegex(@"(?:\*\*|__)(.+?)(?:\*\*|__)", RegexOptions.CultureInvariant)]
    private static partial Regex StrongRegex();

    [GeneratedRegex(@"~~(.+?)~~", RegexOptions.CultureInvariant)]
    private static partial Regex StrikethroughRegex();

    [GeneratedRegex(@"(?<!\*)\*([^*\r\n]+)\*(?!\*)", RegexOptions.CultureInvariant)]
    private static partial Regex EmphasisAsteriskRegex();

    [GeneratedRegex(@"(?<![\w_])_([^_\r\n]+)_(?![\w_])", RegexOptions.CultureInvariant)]
    private static partial Regex EmphasisUnderscoreRegex();

    [GeneratedRegex(@"\\([\\`*_{}\[\]()#+\-.!>])", RegexOptions.CultureInvariant)]
    private static partial Regex MarkdownEscapeRegex();

    [GeneratedRegex(@"(?:[#*0-9]\uFE0F?\u20E3|[\u00A9\u00AE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9-\u21AA\u231A-\u231B\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA-\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u27BF\u2934-\u2935\u2B05-\u2B07\u2B1B-\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDC00-\uDFFF])", RegexOptions.CultureInvariant)]
    private static partial Regex EmojiRegex();

    [GeneratedRegex("[\\u200D\\uFE0E\\uFE0F]", RegexOptions.CultureInvariant)]
    private static partial Regex EmojiFormattingRegex();

    [GeneratedRegex(@"[\t ]+(?=\r?$)", RegexOptions.Multiline | RegexOptions.CultureInvariant)]
    private static partial Regex LineWhitespaceRegex();

    [GeneratedRegex(@"[\t ]{2,}", RegexOptions.CultureInvariant)]
    private static partial Regex RepeatedHorizontalWhitespaceRegex();

    [GeneratedRegex(@"(?:\r?\n){3,}", RegexOptions.CultureInvariant)]
    private static partial Regex ExcessBlankLinesRegex();
}

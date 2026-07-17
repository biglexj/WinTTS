using System.Text.RegularExpressions;
using System.Windows;
using System.Windows.Documents;
using System.Windows.Media;

namespace WinTTS.Controls;

public static partial class MarkdownSourceHighlighter
{
    public static FlowDocument Render(
        string? markdown,
        Brush textBrush,
        Brush skippedBrush,
        Brush skippedBackgroundBrush)
    {
        string source = markdown ?? string.Empty;
        IReadOnlyList<SourceRange> skippedRanges = FindSkippedRanges(source);
        var paragraph = new Paragraph
        {
            FontFamily = new FontFamily("Cascadia Mono, Consolas"),
            FontSize = 15,
            LineHeight = 23,
            Margin = new Thickness(0)
        };

        int position = 0;
        foreach (SourceRange range in skippedRanges)
        {
            if (range.Start > position)
            {
                paragraph.Inlines.Add(new Run(source[position..range.Start]));
            }

            paragraph.Inlines.Add(new Run(source[range.Start..range.End])
            {
                Tag = NarrationDocument.NonNarratedTag,
                Foreground = skippedBrush,
                Background = skippedBackgroundBrush
            });
            position = range.End;
        }

        if (position < source.Length)
        {
            paragraph.Inlines.Add(new Run(source[position..]));
        }

        if (paragraph.Inlines.Count == 0)
        {
            paragraph.Inlines.Add(new Run());
        }

        return new FlowDocument(paragraph)
        {
            PagePadding = new Thickness(0),
            Foreground = textBrush
        };
    }

    internal static IReadOnlyList<SourceRange> FindSkippedRanges(string source)
    {
        var ranges = new List<SourceRange>();
        AddWholeMatches(ranges, FencedCodeRegex(), source);
        AddWholeMatches(ranges, ImageRegex(), source);
        AddWholeMatches(ranges, HtmlCommentRegex(), source);
        AddWholeMatches(ranges, HtmlTagRegex(), source);
        AddWholeMatches(ranges, HorizontalRuleRegex(), source);
        AddWholeMatches(ranges, HeadingMarkerRegex(), source);
        AddWholeMatches(ranges, HashtagMarkerRegex(), source);
        AddWholeMatches(ranges, QuoteMarkerRegex(), source);
        AddWholeMatches(ranges, ListMarkerRegex(), source);
        AddWholeMatches(ranges, MarkdownEscapeRegex(), source, length: 1);
        AddWholeMatches(ranges, EmojiRegex(), source);
        AddWholeMatches(ranges, EmojiFormattingRegex(), source);

        AddOuterMarkers(ranges, LinkRegex(), source, "content");
        AddOuterMarkers(ranges, StrongRegex(), source, "content");
        AddOuterMarkers(ranges, StrikeRegex(), source, "content");
        AddOuterMarkers(ranges, InlineCodeRegex(), source, "content");
        AddOuterMarkers(ranges, EmphasisAsteriskRegex(), source, "content");
        AddOuterMarkers(ranges, EmphasisUnderscoreRegex(), source, "content");

        return MergeRanges(ranges);
    }

    private static void AddWholeMatches(
        ICollection<SourceRange> ranges,
        Regex regex,
        string source,
        int? length = null)
    {
        foreach (Match match in regex.Matches(source))
        {
            ranges.Add(new SourceRange(match.Index, length ?? match.Length));
        }
    }

    private static void AddOuterMarkers(
        ICollection<SourceRange> ranges,
        Regex regex,
        string source,
        string contentGroup)
    {
        foreach (Match match in regex.Matches(source))
        {
            Group content = match.Groups[contentGroup];
            if (!content.Success)
            {
                continue;
            }

            int prefixLength = content.Index - match.Index;
            int suffixStart = content.Index + content.Length;
            int suffixLength = match.Index + match.Length - suffixStart;
            if (prefixLength > 0)
            {
                ranges.Add(new SourceRange(match.Index, prefixLength));
            }

            if (suffixLength > 0)
            {
                ranges.Add(new SourceRange(suffixStart, suffixLength));
            }
        }
    }

    private static IReadOnlyList<SourceRange> MergeRanges(IEnumerable<SourceRange> ranges)
    {
        var ordered = ranges
            .Where(range => range.Length > 0)
            .OrderBy(range => range.Start)
            .ThenByDescending(range => range.Length)
            .ToList();
        if (ordered.Count == 0)
        {
            return [];
        }

        var merged = new List<SourceRange> { ordered[0] };
        foreach (SourceRange range in ordered.Skip(1))
        {
            SourceRange current = merged[^1];
            if (range.Start <= current.End)
            {
                merged[^1] = new SourceRange(
                    current.Start,
                    Math.Max(current.End, range.End) - current.Start);
            }
            else
            {
                merged.Add(range);
            }
        }

        return merged;
    }

    internal readonly record struct SourceRange(int Start, int Length)
    {
        public int End => Start + Length;
    }

    [GeneratedRegex(@"(?ms)^\s{0,3}(?<fence>```|~~~).*?^\s*\k<fence>\s*$")]
    private static partial Regex FencedCodeRegex();

    [GeneratedRegex(@"!\[[^\]]*\]\([^)]*\)")]
    private static partial Regex ImageRegex();

    [GeneratedRegex(@"<!--[\s\S]*?-->")]
    private static partial Regex HtmlCommentRegex();

    [GeneratedRegex(@"<[^>]+>")]
    private static partial Regex HtmlTagRegex();

    [GeneratedRegex(@"^\s{0,3}(?:[-*_]\s*){3,}$", RegexOptions.Multiline)]
    private static partial Regex HorizontalRuleRegex();

    [GeneratedRegex(@"^\s{0,3}#{1,6}\s+", RegexOptions.Multiline)]
    private static partial Regex HeadingMarkerRegex();

    [GeneratedRegex(@"(?<![\w#])#+(?=[\p{L}\p{N}_])")]
    private static partial Regex HashtagMarkerRegex();

    [GeneratedRegex(@"^\s{0,3}>\s?", RegexOptions.Multiline)]
    private static partial Regex QuoteMarkerRegex();

    [GeneratedRegex(@"^\s*(?:[-+*]|\d+[.)])\s+", RegexOptions.Multiline)]
    private static partial Regex ListMarkerRegex();

    [GeneratedRegex(@"\\[\\`*_{}\[\]()#+\-.!>]")]
    private static partial Regex MarkdownEscapeRegex();

    [GeneratedRegex(@"(?<!!)\[(?<content>[^\]]+)\]\([^)]*\)")]
    private static partial Regex LinkRegex();

    [GeneratedRegex(@"(?:\*\*|__)(?<content>.+?)(?:\*\*|__)")]
    private static partial Regex StrongRegex();

    [GeneratedRegex(@"~~(?<content>.+?)~~")]
    private static partial Regex StrikeRegex();

    [GeneratedRegex(@"`(?<content>[^`]+)`")]
    private static partial Regex InlineCodeRegex();

    [GeneratedRegex(@"(?<!\*)\*(?<content>[^*\r\n]+)\*(?!\*)")]
    private static partial Regex EmphasisAsteriskRegex();

    [GeneratedRegex(@"(?<![\w_])_(?<content>[^_\r\n]+)_(?![\w_])")]
    private static partial Regex EmphasisUnderscoreRegex();

    [GeneratedRegex(@"(?:[#*0-9]\uFE0F?\u20E3|[\u00A9\u00AE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9-\u21AA\u231A-\u231B\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA-\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u27BF\u2934-\u2935\u2B05-\u2B07\u2B1B-\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDC00-\uDFFF])")]
    private static partial Regex EmojiRegex();

    [GeneratedRegex("[\\u200D\\uFE0E\\uFE0F]")]
    private static partial Regex EmojiFormattingRegex();
}

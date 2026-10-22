using System.Text;
using System.Windows;
using System.Windows.Documents;
using System.Windows.Media;

namespace WinTTS.Controls;

public static class NarrationDocument
{
    public const string SkipTag = "wintts-skip";
    public const string NonNarratedTag = "wintts-non-narrated";

    public static string GetReadableText(FlowDocument document)
    {
        var builder = new StringBuilder();
        foreach (Block block in document.Blocks)
        {
            AppendBlock(builder, block, false);
        }

        return builder.ToString().Trim();
    }

    public static string GetReadableSelection(System.Windows.Controls.RichTextBox editor)
    {
        if (editor.Selection.IsEmpty)
        {
            return string.Empty;
        }

        var builder = new StringBuilder();
        foreach (Block block in editor.Document.Blocks)
        {
            AppendBlockSelection(
                builder,
                block,
                editor.Selection.Start,
                editor.Selection.End,
                false);
        }

        return builder.ToString().Trim();
    }

    public static bool MarkSelectionSkipped(
        System.Windows.Controls.RichTextBox editor,
        Brush foreground,
        Brush background)
    {
        if (editor.Selection.IsEmpty)
        {
            return false;
        }

        TextPointer selectionEnd = editor.Selection.End;
        editor.Selection.ApplyPropertyValue(TextElement.ForegroundProperty, foreground);
        editor.Selection.ApplyPropertyValue(TextElement.BackgroundProperty, background);
        editor.Selection.ApplyPropertyValue(Inline.TextDecorationsProperty, TextDecorations.Strikethrough);
        SetSelectionTag(
            editor.Document,
            editor.Selection.Start,
            editor.Selection.End,
            SkipTag);
        editor.Selection.Select(selectionEnd, selectionEnd);
        return true;
    }

    public static bool IncludeSelection(System.Windows.Controls.RichTextBox editor, Brush foreground)
    {
        if (editor.Selection.IsEmpty)
        {
            return false;
        }

        TextPointer selectionEnd = editor.Selection.End;
        editor.Selection.ApplyPropertyValue(TextElement.ForegroundProperty, foreground);
        editor.Selection.ApplyPropertyValue(TextElement.BackgroundProperty, Brushes.Transparent);
        editor.Selection.ApplyPropertyValue(Inline.TextDecorationsProperty, null);
        SetSelectionTag(
            editor.Document,
            editor.Selection.Start,
            editor.Selection.End,
            null);
        editor.Selection.Select(selectionEnd, selectionEnd);
        return true;
    }

    public static void ClearSkips(FlowDocument document, Brush foreground)
    {
        foreach (Block block in document.Blocks)
        {
            ClearBlock(block, foreground);
        }
    }

    private static void AppendBlock(StringBuilder builder, Block block, bool parentSkipped)
    {
        bool skipped = parentSkipped || IsNotNarrated(block.Tag);
        switch (block)
        {
            case Paragraph paragraph:
                AppendInlines(builder, paragraph.Inlines, skipped);
                builder.AppendLine();
                break;
            case Section section:
                foreach (Block child in section.Blocks)
                {
                    AppendBlock(builder, child, skipped);
                }
                break;
            case List list:
                foreach (ListItem item in list.ListItems)
                {
                    foreach (Block child in item.Blocks)
                    {
                        AppendBlock(builder, child, skipped);
                    }
                }
                break;
        }
    }

    private static void AppendInlines(StringBuilder builder, InlineCollection inlines, bool parentSkipped)
    {
        foreach (Inline inline in inlines)
        {
            bool skipped = parentSkipped || IsNotNarrated(inline.Tag);
            switch (inline)
            {
                case Run run when !skipped:
                    builder.Append(run.Text);
                    break;
                case Span span:
                    AppendInlines(builder, span.Inlines, skipped);
                    break;
                case LineBreak when !skipped:
                    builder.AppendLine();
                    break;
            }
        }
    }

    private static void AppendBlockSelection(
        StringBuilder builder,
        Block block,
        TextPointer selectionStart,
        TextPointer selectionEnd,
        bool parentSkipped)
    {
        bool skipped = parentSkipped || IsNotNarrated(block.Tag);
        if (block is Paragraph paragraph)
        {
            AppendInlineSelection(builder, paragraph.Inlines, selectionStart, selectionEnd, skipped);
            builder.AppendLine();
        }
        else if (block is Section section)
        {
            foreach (Block child in section.Blocks)
            {
                AppendBlockSelection(builder, child, selectionStart, selectionEnd, skipped);
            }
        }
        else if (block is List list)
        {
            foreach (ListItem item in list.ListItems)
            {
                foreach (Block child in item.Blocks)
                {
                    AppendBlockSelection(builder, child, selectionStart, selectionEnd, skipped);
                }
            }
        }
    }

    private static void AppendInlineSelection(
        StringBuilder builder,
        InlineCollection inlines,
        TextPointer selectionStart,
        TextPointer selectionEnd,
        bool parentSkipped)
    {
        foreach (Inline inline in inlines)
        {
            bool skipped = parentSkipped || IsNotNarrated(inline.Tag);
            if (inline is Span span)
            {
                AppendInlineSelection(builder, span.Inlines, selectionStart, selectionEnd, skipped);
                continue;
            }

            if (inline is not Run run || skipped ||
                run.ContentEnd.CompareTo(selectionStart) <= 0 ||
                run.ContentStart.CompareTo(selectionEnd) >= 0)
            {
                continue;
            }

            TextPointer start = run.ContentStart.CompareTo(selectionStart) < 0 ? selectionStart : run.ContentStart;
            TextPointer end = run.ContentEnd.CompareTo(selectionEnd) > 0 ? selectionEnd : run.ContentEnd;
            builder.Append(new TextRange(start, end).Text);
        }
    }

    private static void ClearBlock(Block block, Brush foreground)
    {
        if (block is Paragraph paragraph)
        {
            ClearInlines(paragraph.Inlines, foreground);
        }
        else if (block is Section section)
        {
            foreach (Block child in section.Blocks)
            {
                ClearBlock(child, foreground);
            }
        }
        else if (block is List list)
        {
            foreach (ListItem item in list.ListItems)
            {
                foreach (Block child in item.Blocks)
                {
                    ClearBlock(child, foreground);
                }
            }
        }
    }

    private static void SetSelectionTag(
        FlowDocument document,
        TextPointer selectionStart,
        TextPointer selectionEnd,
        object? tag)
    {
        foreach (Block block in document.Blocks)
        {
            SetBlockSelectionTag(block, selectionStart, selectionEnd, tag);
        }
    }

    private static void SetBlockSelectionTag(
        Block block,
        TextPointer selectionStart,
        TextPointer selectionEnd,
        object? tag)
    {
        if (block is Paragraph paragraph)
        {
            SetInlineSelectionTag(paragraph.Inlines, selectionStart, selectionEnd, tag);
        }
        else if (block is Section section)
        {
            foreach (Block child in section.Blocks)
            {
                SetBlockSelectionTag(child, selectionStart, selectionEnd, tag);
            }
        }
        else if (block is List list)
        {
            foreach (ListItem item in list.ListItems)
            {
                foreach (Block child in item.Blocks)
                {
                    SetBlockSelectionTag(child, selectionStart, selectionEnd, tag);
                }
            }
        }
    }

    private static void SetInlineSelectionTag(
        InlineCollection inlines,
        TextPointer selectionStart,
        TextPointer selectionEnd,
        object? tag)
    {
        foreach (Inline inline in inlines)
        {
            if (inline.ContentEnd.CompareTo(selectionStart) <= 0 ||
                inline.ContentStart.CompareTo(selectionEnd) >= 0)
            {
                continue;
            }

            if (inline is Span span)
            {
                SetInlineSelectionTag(span.Inlines, selectionStart, selectionEnd, tag);
            }
            else if (inline is Run)
            {
                inline.Tag = tag;
            }
        }
    }

    private static void ClearInlines(InlineCollection inlines, Brush foreground)
    {
        foreach (Inline inline in inlines)
        {
            if (Equals(inline.Tag, SkipTag))
            {
                inline.Tag = null;
                inline.Foreground = foreground;
                inline.Background = Brushes.Transparent;
                inline.TextDecorations = null;
            }

            if (inline is Span span)
            {
                ClearInlines(span.Inlines, foreground);
            }
        }
    }

    private static bool IsNotNarrated(object? tag) =>
        Equals(tag, SkipTag) || Equals(tag, NonNarratedTag);
}

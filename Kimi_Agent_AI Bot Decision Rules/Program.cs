// Kingdoms of Chaos - AI Decision Matrix Document (Arabic RTL)
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using DW = DocumentFormat.OpenXml.Drawing.Wordprocessing;
using A = DocumentFormat.OpenXml.Drawing;
using PIC = DocumentFormat.OpenXml.Drawing.Pictures;

namespace Docx;

public class Program
{
    private static class Colors
    {
        public const string Primary = "e94560";
        public const string Secondary = "f5a623";
        public const string Accent = "9b59b6";
        public const string Dark = "1a1a2e";
        public const string Mid = "16213e";
        public const string BodyText = "2d3436";
        public const string Light = "636e72";
        public const string Border = "b2bec3";
        public const string TableHeader = "dfe6e9";
        public const string CoverText = "ffffff";
        public const string CodeBg = "f8f9fa";
    }

    private const int A4W = 11906;
    private const int A4H = 16838;
    private const long A4WE = 7560000L;
    private const long A4HE = 10692000L;

    public static void Main(string[] args)
    {
        string outputFile = args.Length > 0 ? args[0] : "/mnt/agents/output/Kingdoms_of_Chaos_AI_Strategy.docx";
        string bgDir = "/mnt/agents/output/bg_images";
        Generate(outputFile, bgDir);
    }

    public static void Generate(string outputPath, string bgDir)
    {
        using var doc = WordprocessingDocument.Create(outputPath, WordprocessingDocumentType.Document);
        var mainPart = doc.AddMainDocumentPart();
        mainPart.Document = new Document(new Body());
        var body = mainPart.Document.Body!;

        AddStyles(mainPart);
        AddNumbering(mainPart);

        var coverBgId = AddImage(mainPart, Path.Combine(bgDir, "cover_bg.png"));
        var backBgId = AddImage(mainPart, Path.Combine(bgDir, "backcover_bg.png"));

        uint prId = 1;
        AddCoverSection(body, coverBgId, ref prId);
        AddTocSection(body);
        AddContentSection(doc, body, mainPart, bgDir, ref prId);
        AddBackcoverSection(body, backBgId, ref prId);

        SetUpdateFieldsOnOpen(mainPart);
        doc.Save();
    }

    private static void AddStyles(MainDocumentPart mainPart)
    {
        var sp = mainPart.AddNewPart<StyleDefinitionsPart>();
        sp.Styles = new Styles();

        sp.Styles.Append(new Style(
            new StyleName { Val = "Normal" },
            new StyleParagraphProperties(
                new BiDi(),
                new Justification { Val = JustificationValues.Right },
                new SpacingBetweenLines { After = "200", Line = "360", LineRule = LineSpacingRuleValues.Auto }),
            new StyleRunProperties(
                new RightToLeftText(),
                new RunFonts { Ascii = "Arial", HighAnsi = "Arial", ComplexScript = "Arial" },
                new FontSize { Val = "24" },
                new FontSizeComplexScript { Val = "24" },
                new Color { Val = Colors.BodyText })
        ) { Type = StyleValues.Paragraph, StyleId = "Normal", Default = true });

        sp.Styles.Append(new Style(
            new StyleName { Val = "heading 1" }, new BasedOn { Val = "Normal" },
            new StyleParagraphProperties(
                new KeepNext(), new KeepLines(),
                new BiDi(),
                new Justification { Val = JustificationValues.Right },
                new SpacingBetweenLines { Before = "480", After = "240" },
                new OutlineLevel { Val = 0 }),
            new StyleRunProperties(
                new Bold(), new BoldComplexScript(),
                new FontSize { Val = "36" }, new FontSizeComplexScript { Val = "36" },
                new RunFonts { Ascii = "Arial", HighAnsi = "Arial", ComplexScript = "Arial" },
                new Color { Val = Colors.Primary })
        ) { Type = StyleValues.Paragraph, StyleId = "Heading1" });

        sp.Styles.Append(new Style(
            new StyleName { Val = "heading 2" }, new BasedOn { Val = "Normal" },
            new StyleParagraphProperties(
                new KeepNext(), new KeepLines(),
                new BiDi(),
                new Justification { Val = JustificationValues.Right },
                new SpacingBetweenLines { Before = "360", After = "160" },
                new OutlineLevel { Val = 1 }),
            new StyleRunProperties(
                new Bold(), new BoldComplexScript(),
                new FontSize { Val = "28" }, new FontSizeComplexScript { Val = "28" },
                new RunFonts { Ascii = "Arial", HighAnsi = "Arial", ComplexScript = "Arial" },
                new Color { Val = Colors.Mid })
        ) { Type = StyleValues.Paragraph, StyleId = "Heading2" });

        sp.Styles.Append(new Style(
            new StyleName { Val = "heading 3" }, new BasedOn { Val = "Normal" },
            new StyleParagraphProperties(
                new KeepNext(), new KeepLines(),
                new BiDi(),
                new Justification { Val = JustificationValues.Right },
                new SpacingBetweenLines { Before = "280", After = "120" },
                new OutlineLevel { Val = 2 }),
            new StyleRunProperties(
                new Bold(), new BoldComplexScript(),
                new FontSize { Val = "24" }, new FontSizeComplexScript { Val = "24" },
                new RunFonts { Ascii = "Arial", HighAnsi = "Arial", ComplexScript = "Arial" },
                new Color { Val = Colors.Accent })
        ) { Type = StyleValues.Paragraph, StyleId = "Heading3" });

        sp.Styles.Append(new Style(
            new StyleName { Val = "Caption" }, new BasedOn { Val = "Normal" },
            new StyleParagraphProperties(
                new BiDi(),
                new Justification { Val = JustificationValues.Center },
                new SpacingBetweenLines { Before = "60", After = "320" }),
            new StyleRunProperties(
                new Color { Val = Colors.Light },
                new FontSize { Val = "20" }, new FontSizeComplexScript { Val = "20" })
        ) { Type = StyleValues.Paragraph, StyleId = "Caption" });

        sp.Styles.Append(CreateTocStyle("TOC1", "toc 1", true, "0", "200"));
        sp.Styles.Append(CreateTocStyle("TOC2", "toc 2", false, "360", "60"));
        sp.Styles.Append(CreateTocStyle("TOC3", "toc 3", false, "720", "40"));
    }

    private static Style CreateTocStyle(string id, string name, bool bold, string indent, string before)
    {
        var rpr = new StyleRunProperties(
            new RightToLeftText(),
            new RunFonts { ComplexScript = "Arial" },
            new Color { Val = bold ? Colors.Dark : Colors.Light });
        if (bold) rpr.Append(new Bold());
        return new Style(
            new StyleName { Val = name }, new BasedOn { Val = "Normal" },
            new StyleParagraphProperties(
                new BiDi(),
                new Tabs(new TabStop { Val = TabStopValues.Right, Leader = TabStopLeaderCharValues.Dot, Position = 9350 }),
                new SpacingBetweenLines { Before = before, After = "60" },
                new Indentation { Left = indent }),
            rpr
        ) { Type = StyleValues.Paragraph, StyleId = id };
    }

    private static void AddCoverSection(Body body, string coverBgId, ref uint prId)
    {
        body.Append(new Paragraph(new Run(CreateFloatingBackground(coverBgId, prId++, "CoverBg"))));
        body.Append(new Paragraph(new ParagraphProperties(new SpacingBetweenLines { Before = "5000" }), new Run()));

        body.Append(new Paragraph(
            new ParagraphProperties(
                new BiDi(),
                new Justification { Val = JustificationValues.Center },
                new SpacingBetweenLines { After = "200" }),
            new Run(new RunProperties(
                    new RightToLeftText(),
                    new FontSize { Val = "72" }, new FontSizeComplexScript { Val = "72" },
                    new Bold(), new BoldComplexScript(),
                    new Color { Val = Colors.CoverText },
                    new RunFonts { ComplexScript = "Arial" },
                    new Spacing { Val = 30 }),
                new Text("Kingdoms of Chaos"))));

        body.Append(new Paragraph(
            new ParagraphProperties(
                new BiDi(),
                new Justification { Val = JustificationValues.Center },
                new SpacingBetweenLines { After = "600" }),
            new Run(new RunProperties(
                    new RightToLeftText(),
                    new FontSize { Val = "36" }, new FontSizeComplexScript { Val = "36" },
                    new Color { Val = Colors.Secondary },
                    new RunFonts { ComplexScript = "Arial" }),
                new Text("\u0646\u0638\u0627\u0645 \u0630\u0643\u0627\u0621 \u0627\u0635\u0637\u0646\u0627\u0639\u064a \u0645\u062a\u0642\u062f\u0645 \u0644\u0627\u062a\u062e\u0627\u0630 \u0627\u0644\u0642\u0631\u0627\u0631 \u0627\u0644\u0627\u0633\u062a\u0631\u0627\u062a\u064a\u062c\u064a"))));

        body.Append(new Paragraph(
            new ParagraphProperties(
                new BiDi(),
                new Justification { Val = JustificationValues.Center },
                new SpacingBetweenLines { After = "4000" }),
            new Run(new RunProperties(
                    new RightToLeftText(),
                    new FontSize { Val = "22" }, new FontSizeComplexScript { Val = "22" },
                    new Color { Val = "a0a0a0" },
                    new RunFonts { ComplexScript = "Arial" }),
                new Text("\u0645\u0635\u0641\u0648\u0641\u0627\u062a \u0627\u0644\u0642\u0631\u0627\u0631 - \u0627\u0644\u062a\u0648\u0632\u064a\u0639\u0627\u062a \u0627\u0644\u0625\u062d\u0635\u0627\u0626\u064a\u0629 - \u0627\u0644\u0634\u0641\u0631\u0627\u062a \u0627\u0644\u0648\u0647\u0645\u064a\u0629"))));

        body.Append(new Paragraph(
            new ParagraphProperties(
                new BiDi(),
                new Justification { Val = JustificationValues.Center }),
            new Run(new RunProperties(
                    new RightToLeftText(),
                    new FontSize { Val = "20" }, new FontSizeComplexScript { Val = "20" },
                    new Color { Val = "808080" },
                    new RunFonts { ComplexScript = "Arial" }),
                new Text("\u0648\u062b\u064a\u0642\u0629 \u062a\u0635\u0645\u064a\u0645 \u062a\u0642\u0646\u064a\u0629 - 2025"))));

        body.Append(new Paragraph(new ParagraphProperties(new SectionProperties(
            new TitlePage(),
            new SectionType { Val = SectionMarkValues.NextPage },
            new PageSize { Width = (UInt32Value)(uint)A4W, Height = (UInt32Value)(uint)A4H },
            new PageMargin { Top = 0, Right = 0, Bottom = 0, Left = 0, Header = 0, Footer = 0 }))));
    }

    private static void AddTocSection(Body body)
    {
        body.Append(new Paragraph(
            new ParagraphProperties(
                new BiDi(),
                new Justification { Val = JustificationValues.Right },
                new ParagraphStyleId { Val = "Heading1" }),
            new Run(new RunProperties(new RightToLeftText()), new Text("\u0627\u0644\u0645\u062d\u062a\u0648\u064a\u0627\u062a"))));

        body.Append(new Paragraph(
            new Run(new FieldChar { FieldCharType = FieldCharValues.Begin }),
            new Run(new FieldCode(" TOC \\o \"1-3\" \\h \\z \\u ") { Space = SpaceProcessingModeValues.Preserve }),
            new Run(new FieldChar { FieldCharType = FieldCharValues.Separate })));

        string[,] toc = {
            { "\u0645\u0642\u062f\u0645\u0629 \u0641\u064a \u0646\u0638\u0627\u0645 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a", "1", "3" },
            { "\u0627\u0644\u0631\u0648\u0628\u0648\u062a \u0627\u0644\u0647\u062c\u0648\u0645\u064a (Aggro)", "1", "4" },
            { "\u0627\u0644\u0645\u0639\u0627\u062f\u0644\u0627\u062a \u0627\u0644\u0631\u064a\u0627\u0636\u064a\u0629 \u0648\u0627\u0644\u0627\u062d\u062a\u0645\u0627\u0644\u0627\u062a", "2", "5" },
            { "\u0627\u0644\u0634\u0641\u0631\u0629 \u0627\u0644\u0648\u0647\u0645\u064a\u0629", "2", "6" },
            { "\u0627\u0644\u0631\u0648\u0628\u0648\u062a \u0627\u0644\u062f\u0641\u0627\u0639\u064a (Turtle)", "1", "7" },
            { "\u0645\u0635\u0641\u0648\u0641\u0629 \u0627\u0644\u062f\u0641\u0627\u0639 \u0648\u0627\u0644\u0634\u0641\u0631\u0629", "2", "8" },
            { "\u0627\u0644\u0631\u0648\u0628\u0648\u062a \u0627\u0644\u0641\u0648\u0636\u0648\u064a (Chaotic)", "1", "9" },
            { "\u0646\u0638\u0627\u0645 \u0627\u0644\u062a\u0628\u062f\u064a\u0644 \u0627\u0644\u0639\u0634\u0648\u0627\u0626\u064a", "2", "10" },
            { "\u0627\u0644\u062a\u062d\u0644\u064a\u0644 \u0627\u0644\u0645\u0642\u0627\u0631\u0646 \u0648\u0627\u0644\u062a\u0648\u0635\u064a\u0627\u062a", "1", "11" },
        };
        for (int i = 0; i < toc.GetLength(0); i++)
            body.Append(new Paragraph(
                new ParagraphProperties(new ParagraphStyleId { Val = $"TOC{toc[i, 1]}" }),
                new Run(new RunProperties(new RightToLeftText()), new Text(toc[i, 0])),
                new Run(new TabChar()),
                new Run(new Text(toc[i, 2]))));

        body.Append(new Paragraph(new Run(new FieldChar { FieldCharType = FieldCharValues.End })));

        body.Append(new Paragraph(new ParagraphProperties(new SectionProperties(
            new SectionType { Val = SectionMarkValues.NextPage },
            new PageSize { Width = (UInt32Value)(uint)A4W, Height = (UInt32Value)(uint)A4H },
            new PageMargin { Top = 1800, Right = 1440, Bottom = 1440, Left = 1440, Header = 720, Footer = 720 }))));
    }

    private static void AddContentSection(WordprocessingDocument doc, Body body,
        MainDocumentPart mainPart, string bgDir, ref uint prId)
    {
        var headerPart = mainPart.AddNewPart<HeaderPart>();
        var headerId = mainPart.GetIdOfPart(headerPart);
        headerPart.Header = new Header(
            new Paragraph(
                new ParagraphProperties(new Justification { Val = JustificationValues.Center }),
                new Run(new RunProperties(
                        new RightToLeftText(),
                        new FontSize { Val = "18" }, new FontSizeComplexScript { Val = "18" },
                        new Color { Val = Colors.Light },
                        new RunFonts { ComplexScript = "Arial" }),
                    new Text("Kingdoms of Chaos - \u0646\u0638\u0627\u0645 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a"))));

        var footerPart = mainPart.AddNewPart<FooterPart>();
        var footerId = mainPart.GetIdOfPart(footerPart);
        var fp = new Paragraph(new ParagraphProperties(new Justification { Val = JustificationValues.Center }));
        fp.Append(new Run(new RunProperties(new FontSize { Val = "18" }, new Color { Val = Colors.Light }),
            new FieldChar { FieldCharType = FieldCharValues.Begin }));
        fp.Append(new Run(new RunProperties(new FontSize { Val = "18" }, new Color { Val = Colors.Light }),
            new FieldCode(" PAGE ") { Space = SpaceProcessingModeValues.Preserve }));
        fp.Append(new Run(new RunProperties(new FontSize { Val = "18" }, new Color { Val = Colors.Light }),
            new FieldChar { FieldCharType = FieldCharValues.Separate }));
        fp.Append(new Run(new RunProperties(new FontSize { Val = "18" }, new Color { Val = Colors.Light }),
            new Text("1")));
        fp.Append(new Run(new RunProperties(new FontSize { Val = "18" }, new Color { Val = Colors.Light }),
            new FieldChar { FieldCharType = FieldCharValues.End }));
        fp.Append(new Run(new RunProperties(new FontSize { Val = "18" }, new Color { Val = Colors.Light }),
            new Text(" / ") { Space = SpaceProcessingModeValues.Preserve }));
        fp.Append(new Run(new RunProperties(new FontSize { Val = "18" }, new Color { Val = Colors.Light }),
            new FieldChar { FieldCharType = FieldCharValues.Begin }));
        fp.Append(new Run(new RunProperties(new FontSize { Val = "18" }, new Color { Val = Colors.Light }),
            new FieldCode(" NUMPAGES ") { Space = SpaceProcessingModeValues.Preserve }));
        fp.Append(new Run(new RunProperties(new FontSize { Val = "18" }, new Color { Val = Colors.Light }),
            new FieldChar { FieldCharType = FieldCharValues.Separate }));
        fp.Append(new Run(new RunProperties(new FontSize { Val = "18" }, new Color { Val = Colors.Light }),
            new Text("1")));
        fp.Append(new Run(new RunProperties(new FontSize { Val = "18" }, new Color { Val = Colors.Light }),
            new FieldChar { FieldCharType = FieldCharValues.End }));
        footerPart.Footer = new Footer(fp);

        // Introduction
        body.Append(H1("\u0645\u0642\u062f\u0645\u0629 \u0641\u064a \u0646\u0638\u0627\u0645 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a", "_Toc001"));
        body.Append(ArP("\u064a\u0642\u062f\u0645 \u0647\u0630\u0627 \u0627\u0644\u0645\u0633\u062a\u0646\u062f \u0625\u0637\u0627\u0631\u0627\u064b \u0634\u0627\u0645\u0644\u0627\u064b \u0644\u062a\u0635\u0645\u064a\u0645 \u0646\u0638\u0627\u0645 \u0630\u0643\u0627\u0621 \u0627\u0635\u0637\u0646\u0627\u0639\u064a \u0645\u062a\u0642\u062f\u0645 \u0644\u0644\u0639\u0628\u0629 Kingdoms of Chaos\u060c \u0648\u0647\u064a \u0644\u0639\u0628\u0629 \u0627\u0633\u062a\u0631\u0627\u062a\u064a\u062c\u064a\u0629 \u0639\u0644\u0649 \u0634\u0628\u0643\u0629 Grid-Based \u0628\u062d\u062c\u0645 6x6. \u064a\u062a\u0645\u064a\u0632 \u0627\u0644\u0646\u0638\u0627\u0645 \u0628\u0648\u062c\u0648\u062f \u062b\u0644\u0627\u062b\u0629 \u0634\u062e\u0635\u064a\u0627\u062a \u0630\u0643\u0627\u0621 \u0627\u0635\u0637\u0646\u0627\u0639\u064a \u0630\u0627\u062a \u0633\u0644\u0648\u0643\u064a\u0627\u062a \u0641\u0631\u064a\u062f\u0629\u060c \u0643\u0644 \u0645\u0646\u0647\u0627 \u064a\u062a\u0628\u0639 \u0645\u0646\u0637\u0642\u0627\u064b \u0631\u064a\u0627\u0636\u064a\u0627\u064b \u0645\u062e\u062a\u0644\u0641\u0627\u064b \u0641\u064a \u0627\u062a\u062e\u0627\u0630 \u0627\u0644\u0642\u0631\u0627\u0631\u0627\u062a."));
        body.Append(ArP("\u062a\u0633\u062a\u0646\u062f \u062c\u0645\u064a\u0639 \u0627\u0644\u0631\u0648\u0628\u0648\u062a\u0627\u062a \u0625\u0644\u0649 \u0623\u0631\u0628\u0639\u0629 \u0645\u062f\u062e\u0644\u0627\u062a \u0631\u0626\u064a\u0633\u064a\u0629: \u0646\u0642\u0627\u0637 \u0627\u0644\u0635\u062d\u0629 \u0627\u0644\u062d\u0627\u0644\u064a\u0629 (HP)\u060c \u0627\u0644\u0645\u0628\u0644\u063a \u0627\u0644\u0630\u0647\u0628\u064a (Gold)\u060c \u0627\u0644\u0623\u0648\u0631\u0627\u0642 \u0627\u0644\u0645\u062a\u0627\u062d\u0629 \u0641\u064a \u0627\u0644\u064a\u062f (3 Cards)\u060c \u0648\u062d\u0627\u0644\u0629 \u0627\u0644\u0634\u0628\u0643\u0629 (6x6 Grid State). \u064a\u062a\u0645 \u062d\u0633\u0627\u0628 \u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u062a\u0647\u062f\u064a\u062f \u0627\u0644\u0628\u0642\u0627\u0626\u064a (Survival Threat Level) \u0644\u0643\u0644 \u0631\u0648\u0628\u0648\u062a \u0628\u0634\u0643\u0644 \u062f\u064a\u0646\u0627\u0645\u064a\u0643\u064a\u060c \u0645\u0645\u0627 \u064a\u0624\u062b\u0631 \u0639\u0644\u0649 \u0642\u0631\u0627\u0631\u0627\u062a\u0647 \u0627\u0644\u0644\u062d\u0638\u064a\u0629."));

        // Aggressive Bot
        body.Append(H1("\u0627\u0644\u0631\u0648\u0628\u0648\u062a \u0627\u0644\u0647\u062c\u0648\u0645\u064a (Aggro)", "_Toc002"));
        body.Append(ArP("\u0627\u0644\u0631\u0648\u0628\u0648\u062a \u0627\u0644\u0647\u062c\u0648\u0645\u064a \u0647\u0648 \u0634\u062e\u0635\u064a\u0629 \u062a\u062a\u0628\u0639 \u0627\u0633\u062a\u0631\u0627\u062a\u064a\u062c\u064a\u0629 \u0627\u0644\u0647\u062c\u0648\u0645 \u062e\u064a\u0631 \u0648\u0633\u064a\u0644\u0629 \u0644\u0644\u062f\u0641\u0627\u0639. \u064a\u0639\u0637\u064a \u0627\u0644\u0623\u0648\u0644\u0648\u064a\u0629 \u0627\u0644\u0642\u0635\u0648\u0649 \u0644\u0635\u064a\u062f \u0627\u0644\u0644\u0627\u0639\u0628\u064a\u0646 \u0630\u0648\u064a \u0646\u0642\u0627\u0637 \u0627\u0644\u0635\u062d\u0629 \u0627\u0644\u0645\u0646\u062e\u0641\u0636\u0629\u060c \u0648\u0634\u0631\u0627\u0621 \u0623\u0648\u0631\u0627\u0642 \u0627\u0644\u0647\u062c\u0648\u0645 \u0641\u0642\u0637\u060c \u0648\u0625\u0646\u0641\u0627\u0642 \u062c\u0645\u064a\u0639 \u0646\u0642\u0627\u0637 \u0627\u0644\u0625\u062c\u0631\u0627\u0621 \u0641\u064a \u0627\u0644\u062d\u0631\u0643\u0627\u062a \u0627\u0644\u0647\u062c\u0648\u0645\u064a\u0629."));

        body.Append(H2("\u0627\u0644\u0642\u0648\u0627\u0639\u062f \u0627\u0644\u0645\u0646\u0637\u0642\u064a\u0629 \u0627\u0644\u0623\u0633\u0627\u0633\u064a\u0629"));
        body.Append(Bullet("\u062a\u062d\u062f\u064a\u062f \u0627\u0644\u0647\u062f\u0641: \u064a\u062e\u062a\u0627\u0631 \u062f\u0627\u0626\u0645\u0627\u064b \u0627\u0644\u0644\u0627\u0639\u0628 \u0630\u064a \u0623\u0642\u0644 \u0646\u0642\u0627\u0637 \u0635\u062d\u0629 (HP) \u0641\u064a \u0646\u0637\u0627\u0642 \u0627\u0644\u0634\u0628\u0643\u0629"));
        body.Append(Bullet("\u0634\u0631\u0627\u0621 \u0627\u0644\u0623\u0648\u0631\u0627\u0642: \u064a\u0642\u062a\u0635\u0631 \u0639\u0644\u0649 \u0623\u0648\u0631\u0627\u0642 \u0627\u0644\u0647\u062c\u0648\u0645 \u0641\u0642\u0637 (Attack Cards) \u0628\u0623\u0639\u0644\u0649 \u0642\u064a\u0645\u0629 \u0636\u0631\u0631"));
        body.Append(Bullet("\u0627\u0644\u062d\u0631\u0643\u0627\u062a: \u064a\u0633\u062a\u062e\u062f\u0645 \u062c\u0645\u064a\u0639 \u0646\u0642\u0627\u0637 \u0627\u0644\u0625\u062c\u0631\u0627\u0621 (Action Points) \u0641\u064a \u0627\u0644\u062d\u0631\u0643\u0627\u062a \u0627\u0644\u0647\u062c\u0648\u0645\u064a\u0629"));
        body.Append(Bullet("\u0627\u0644\u062a\u0631\u0627\u062c\u0639: \u0644\u0627 \u064a\u062a\u0631\u0627\u062c\u0639 \u0625\u0644\u0627 \u0625\u0630\u0627 \u0643\u0627\u0646\u062a \u0646\u0642\u0627\u0637 \u0635\u062d\u062a\u0647 \u0623\u0642\u0644 \u0645\u0646 15% \u0645\u0646 \u0627\u0644\u062d\u062f \u0627\u0644\u0623\u0642\u0635\u0649"));

        body.Append(H2("\u062a\u0648\u0632\u064a\u0639 \u0627\u0644\u0623\u0648\u0632\u0627\u0646 \u0627\u0644\u0627\u062d\u0635\u0627\u0626\u064a"));
        body.Append(MakeWeightTable(new string[,] {
            { "\u0627\u0644\u0647\u062c\u0648\u0645 \u0627\u0644\u0645\u0628\u0627\u0634\u0631", "45%" },
            { "\u0627\u0644\u0645\u0644\u0627\u062d\u0642\u0629", "25%" },
            { "\u0634\u0631\u0627\u0621 \u0623\u0648\u0631\u0627\u0642 \u0647\u062c\u0648\u0645", "20%" },
            { "\u0627\u0644\u062f\u0641\u0627\u0639 (\u0627\u0644\u0637\u0648\u0627\u0631\u0626 \u0641\u0642\u0637)", "10%" }
        }));

        body.Append(H2("\u0627\u0644\u0645\u0639\u0627\u062f\u0644\u0627\u062a \u0627\u0644\u0631\u064a\u0627\u0636\u064a\u0629"));
        body.Append(ArP("\u0645\u0639\u0627\u062f\u0644\u0629 \u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u062a\u0647\u062f\u064a\u062f \u0627\u0644\u0628\u0642\u0627\u0626\u064a (STL) \u0644\u0644\u0631\u0648\u0628\u0648\u062a \u0627\u0644\u0647\u062c\u0648\u0645\u064a:"));
        body.Append(FormulaBox("STL = (1 - HPcurrent / HPmax) * 0.3 + (Distance / 6) * 0.4 + (1 / EnemyHP) * 0.3"));
        body.Append(ArP("\u062d\u064a\u062b HPcurrent \u0647\u064a \u0646\u0642\u0627\u0637 \u0627\u0644\u0635\u062d\u0629 \u0627\u0644\u062d\u0627\u0644\u064a\u0629\u060c HPmax \u0627\u0644\u062d\u062f \u0627\u0644\u0623\u0642\u0635\u0649\u060c Distance \u0647\u064a \u0627\u0644\u0645\u0633\u0627\u0641\u0629 \u0644\u0644\u0647\u062f\u0641\u060c \u0648EnemyHP \u0647\u064a \u0635\u062d\u0629 \u0627\u0644\u0639\u062f\u0648 \u0627\u0644\u0623\u0636\u0639\u0641."));
        body.Append(ArP("\u0645\u0639\u0627\u062f\u0644\u0629 \u0627\u062d\u062a\u0645\u0627\u0644\u064a\u0629 \u0627\u0644\u0647\u062c\u0648\u0645 \u0639\u0644\u0649 \u0647\u062f\u0641 \u0645\u062d\u062f\u062f (Target Priority Probability):"));
        body.Append(FormulaBox("P(target_i) = (1 / HP_i) / Sum(1 / HP_j) for j = 1 to N"));

        body.Append(H2("\u0627\u0644\u0634\u0641\u0631\u0629 \u0627\u0644\u0648\u0647\u0645\u064a\u0629"));
        body.Append(CodeBlock(new string[] {
            "FUNCTION AggroBot_Decide(grid, players, cards, gold, hp):",
            "    target = FIND_MIN(players, hp)",
            "    distance = CALC_DISTANCE(grid, self, target)",
            "    stl = (1 - hp/MAX_HP) * 0.3 + (distance/6) * 0.4 + (1/target.hp) * 0.3",
            "    IF distance <= 1 THEN",
            "        RETURN Attack(target, STRONGEST_CARD(cards))",
            "    ELSE IF gold >= 50 AND HAS_ATTACK_CARD(shop) THEN",
            "        RETURN BuyCard(ATTACK_TYPE)",
            "    ELSE IF hp < MAX_HP * 0.15 THEN",
            "        RETURN Retreat(NEAREST_SAFE_ZONE)",
            "    ELSE",
            "        RETURN MoveToward(target)",
            "    END IF",
            "END FUNCTION"
        }));

        // Defensive Bot
        body.Append(H1("\u0627\u0644\u0631\u0648\u0628\u0648\u062a \u0627\u0644\u062f\u0641\u0627\u0639\u064a (Turtle)", "_Toc003"));
        body.Append(ArP("\u0627\u0644\u0631\u0648\u0628\u0648\u062a \u0627\u0644\u062f\u0641\u0627\u0639\u064a (\u0627\u0644\u0633\u0644\u062d\u0641\u0627\u0629) \u064a\u062a\u0628\u0639 \u0627\u0633\u062a\u0631\u0627\u062a\u064a\u062c\u064a\u0629 \u062a\u062d\u0635\u064a\u0646 \u0645\u062a\u0642\u062f\u0645\u0629. \u064a\u0639\u0637\u064a \u0627\u0644\u0623\u0648\u0644\u0648\u064a\u0629 \u0644\u0628\u0646\u0627\u0621 \u0627\u0644\u062c\u062f\u0631\u0627\u0646 \u0648\u0627\u0644\u0641\u062e\u0627\u062e \u062d\u0648\u0644 \u0645\u0645\u0644\u0643\u062a\u0647\u060c \u0648\u062a\u0643\u062f\u064a\u0633 \u0627\u0644\u0630\u0647\u0628\u060c \u0648\u0644\u0639\u0628 \u0623\u0648\u0631\u0627\u0642 \u0627\u0644\u0634\u0641\u0627\u0621 \u0648\u0627\u0644\u0639\u0644\u0627\u062c. \u064a\u0647\u0627\u062c\u0645 \u0641\u0642\u0637 \u0639\u0646\u062f \u0627\u0644\u0627\u0633\u062a\u0641\u0632\u0627\u0632 \u0627\u0644\u0645\u0628\u0627\u0634\u0631."));

        body.Append(H2("\u0627\u0644\u0642\u0648\u0627\u0639\u062f \u0627\u0644\u0645\u0646\u0637\u0642\u064a\u0629 \u0627\u0644\u0623\u0633\u0627\u0633\u064a\u0629"));
        body.Append(Bullet("\u0627\u0644\u062a\u062d\u0635\u064a\u0646: \u064a\u0628\u0646\u064a \u062c\u062f\u0631\u0627\u0646 \u0641\u064a \u0623\u0648\u0644 3 \u0623\u062f\u0648\u0627\u0631 \u062f\u0648\u0646 \u0627\u0633\u062a\u062b\u0646\u0627\u0621"));
        body.Append(Bullet("\u0627\u0644\u0630\u0647\u0628: \u064a\u062d\u062a\u0641\u0638 \u0628ـ 60% \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644 \u0645\u0646 \u0627\u0644\u0630\u0647\u0628 \u0643\u0627\u062d\u062a\u064a\u0627\u0637\u064a \u062f\u0641\u0627\u0639\u064a"));
        body.Append(Bullet("\u0627\u0644\u0623\u0648\u0631\u0627\u0642: \u064a\u0641\u0636\u0644 \u0623\u0648\u0631\u0627\u0642 \u0627\u0644\u0634\u0641\u0627\u0621 > \u0627\u0644\u062f\u0631\u0648\u0639 > \u0627\u0644\u0641\u062e\u0627\u062e > \u0627\u0644\u0647\u062c\u0648\u0645"));
        body.Append(Bullet("\u0627\u0644\u0647\u062c\u0648\u0645 \u0627\u0644\u0645\u0636\u0627\u062f: \u064a\u0647\u0627\u062c\u0645 \u0641\u0642\u0637 \u0625\u0630\u0627 \u0627\u0642\u062a\u0631\u0628 \u0627\u0644\u0639\u062f\u0648 \u0628\u0645\u0633\u0627\u0641\u0629 2 \u0645\u0631\u0628\u0639\u0627\u062a \u0623\u0648 \u0623\u0642\u0644"));

        body.Append(H2("\u062a\u0648\u0632\u064a\u0639 \u0627\u0644\u0623\u0648\u0632\u0627\u0646 \u0627\u0644\u0627\u062d\u0635\u0627\u0626\u064a"));
        body.Append(MakeWeightTable(new string[,] {
            { "\u0628\u0646\u0627\u0621 \u062c\u062f\u0631\u0627\u0646", "30%" },
            { "\u0648\u0636\u0639 \u0641\u062e\u0627\u062e", "20%" },
            { "\u0644\u0639\u0628 \u0623\u0648\u0631\u0627\u0642 \u0634\u0641\u0627\u0621", "25%" },
            { "\u062a\u0643\u062f\u064a\u0633 \u0627\u0644\u0630\u0647\u0628", "15%" },
            { "\u0627\u0644\u0647\u062c\u0648\u0645 \u0627\u0644\u0645\u0636\u0627\u062f", "10%" }
        }));

        body.Append(H2("\u0627\u0644\u0645\u0639\u0627\u062f\u0644\u0627\u062a \u0627\u0644\u0631\u064a\u0627\u0636\u064a\u0629"));
        body.Append(ArP("\u0645\u0639\u0627\u062f\u0644\u0629 \u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u062a\u0647\u062f\u064a\u062f \u0627\u0644\u0628\u0642\u0627\u0626\u064a (STL) \u0644\u0644\u0631\u0648\u0628\u0648\u062a \u0627\u0644\u062f\u0641\u0627\u0639\u064a:"));
        body.Append(FormulaBox("STL = (HPmax - HPcurrent) / HPmax * 0.5 + (EnemyDist / 6) * 0.3 + (GoldReserve / MaxGold) * 0.2"));
        body.Append(ArP("\u0645\u0639\u0627\u062f\u0644\u0629 \u0642\u0631\u0627\u0631 \u0627\u0644\u0628\u0646\u0627\u0621 (Build Decision Probability):"));
        body.Append(FormulaBox("P(build) = 1 - e^(-lambda * threat)"));

        body.Append(H2("\u0645\u0635\u0641\u0648\u0641\u0629 \u0627\u0644\u062f\u0641\u0627\u0639 \u0648\u0627\u0644\u0634\u0641\u0631\u0629 \u0627\u0644\u0648\u0647\u0645\u064a\u0629"));
        body.Append(CodeBlock(new string[] {
            "FUNCTION TurtleBot_Decide(grid, players, cards, gold, hp, walls):",
            "    nearestEnemy = FIND_NEAREST(players, self)",
            "    enemyDist = CALC_DISTANCE(grid, self, nearestEnemy)",
            "    stl = (MAX_HP - hp)/MAX_HP * 0.5 + enemyDist/6 * 0.3 + gold/MAX_GOLD * 0.2",
            "    IF walls < 3 AND gold >= WALL_COST THEN",
            "        RETURN BuildWall(OPTIMAL_POSITION)",
            "    ELSE IF hp < MAX_HP * 0.6 AND HAS_HEAL_CARD(cards) THEN",
            "        RETURN PlayCard(HEAL_TYPE)",
            "    ELSE IF enemyDist <= 2 THEN",
            "        RETURN CounterAttack(nearestEnemy)",
            "    ELSE IF gold >= TRAP_COST AND enemyDist <= 4 THEN",
            "        RETURN PlaceTrap(PREDICT_PATH(enemy))",
            "    ELSE",
            "        RETURN AccumulateGold()",
            "    END IF",
            "END FUNCTION"
        }));

        // Chaotic Bot
        body.Append(H1("\u0627\u0644\u0631\u0648\u0628\u0648\u062a \u0627\u0644\u0641\u0648\u0636\u0648\u064a (Chaotic)", "_Toc004"));
        body.Append(ArP("\u0627\u0644\u0631\u0648\u0628\u0648\u062a \u0627\u0644\u0641\u0648\u0636\u0648\u064a \u0647\u0648 \u0627\u0644\u0634\u062e\u0635\u064a\u0629 \u0627\u0644\u0623\u0643\u062b\u0631 \u062a\u0639\u0642\u064a\u062f\u0627\u064b. \u064a\u0633\u062a\u062e\u062f\u0645 \u0646\u0638\u0627\u0645 \u0623\u0648\u0632\u0627\u0646 \u0639\u0634\u0648\u0627\u0626\u064a \u064a\u0628\u062f\u0644 \u0627\u0644\u0623\u0648\u0644\u0648\u064a\u0627\u062a \u0643\u0644 \u062f\u0648\u0631\u064a\u0646\u060c \u0645\u0645\u0627 \u064a\u062c\u0639\u0644 \u062a\u062d\u0631\u0643\u0627\u062a\u0647 \u063a\u064a\u0631 \u0645\u062a\u0648\u0642\u0639\u0629 \u062a\u0645\u0627\u0645\u0627\u064b \u0648\u0645\u0632\u0639\u062c\u0629 \u0644\u0627\u0633\u062a\u0631\u0627\u062a\u064a\u062c\u064a\u0627\u062a \u0627\u0644\u062e\u0635\u0648\u0645."));

        body.Append(H2("\u0646\u0638\u0627\u0645 \u0627\u0644\u062a\u0628\u062f\u064a\u0644 \u0627\u0644\u0639\u0634\u0648\u0627\u0626\u064a (Priority Switching System)"));
        body.Append(ArP("\u064a\u062a\u0628\u0639 \u0627\u0644\u0631\u0648\u0628\u0648\u062a \u0627\u0644\u0641\u0648\u0636\u0648\u064a \u0622\u0644\u064a\u0629 \u0627\u062d\u062a\u0645\u0627\u0644\u064a\u0629 \u0645\u0632\u062f\u0648\u062c\u0629: \u0646\u0638\u0627\u0645 \u0623\u0648\u0632\u0627\u0646 \u0645\u062a\u063a\u064a\u0631 \u0643\u0644 \u062f\u0648\u0631\u064a\u0646\u060c \u0648\u0645\u0648\u0644\u062f \u0623\u0631\u0642\u0627\u0645 \u0639\u0634\u0648\u0627\u0626\u064a \u0645\u0636\u0645\u0646 \u0644\u062a\u062d\u062f\u064a\u062f \u0646\u0648\u0639 \u0627\u0644\u062d\u0631\u0643\u0629."));

        body.Append(H3("\u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0647\u062c\u0648\u0645\u064a (Aggressive Mode)"));
        body.Append(MakeWeightTable(new string[,] {
            { "\u0627\u0644\u0647\u062c\u0648\u0645 \u0627\u0644\u0645\u0628\u0627\u0634\u0631", "40%" },
            { "\u0627\u0644\u062a\u062e\u0631\u064a\u0628", "30%" },
            { "\u0627\u0644\u062d\u0631\u0643\u0629 \u0627\u0644\u0639\u0634\u0648\u0627\u0626\u064a\u0629", "20%" },
            { "\u0627\u0644\u062e\u062f\u0639", "10%" }
        }));

        body.Append(H3("\u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u062f\u0641\u0627\u0639\u064a (Defensive Mode)"));
        body.Append(MakeWeightTable(new string[,] {
            { "\u0628\u0646\u0627\u0621 \u062c\u062f\u0631\u0627\u0646", "35%" },
            { "\u0646\u0635\u0628 \u0627\u0644\u0641\u062e\u0627\u062e", "25%" },
            { "\u0627\u0644\u0634\u0641\u0627\u0621 \u0627\u0644\u0630\u0627\u062a\u064a", "25%" },
            { "\u0627\u0644\u0627\u0633\u062a\u0639\u062f\u0627\u062f", "15%" }
        }));

        body.Append(H3("\u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0645\u062e\u062a\u0644\u0637 (Mixed Mode)"));
        body.Append(MakeWeightTable(new string[,] {
            { "\u062d\u0631\u0643\u0629 \u0639\u0634\u0648\u0627\u0626\u064a\u0629", "30%" },
            { "\u0647\u062c\u0648\u0645 \u0645\u0641\u0627\u062c\u064a\u0621", "25%" },
            { "\u062f\u0641\u0627\u0639 \u0645\u0641\u0627\u062c\u064a\u0621", "25%" },
            { "\u062a\u062c\u0645\u064a\u0639 \u0645\u0648\u0627\u0631\u062f", "20%" }
        }));

        body.Append(H2("\u0627\u0644\u0645\u0639\u0627\u062f\u0644\u0627\u062a \u0627\u0644\u0631\u064a\u0627\u0636\u064a\u0629"));
        body.Append(ArP("\u0645\u0639\u0627\u062f\u0644\u0629 \u0627\u062d\u062a\u0645\u0627\u0644\u064a\u0629 \u0627\u062e\u062a\u064a\u0627\u0631 \u0627\u0644\u0648\u0636\u0639 (Mode Selection) \u0628\u0627\u0633\u062a\u062e\u062f\u0627\u0645 \u0627\u0644\u062a\u0648\u0632\u064a\u0639 \u0627\u0644\u0633\u0644\u0633\u064a Softmax:"));
        body.Append(FormulaBox("P(Mode = i) = exp(Q(s,i)) / Sum(exp(Q(s,j))) for j = 1 to 3"));
        body.Append(ArP("\u0645\u0639\u0627\u062f\u0644\u0629 \u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u062a\u0647\u062f\u064a\u062f \u0627\u0644\u0628\u0642\u0627\u0626\u064a \u0645\u0639 \u0645\u0639\u0627\u0645\u0644 \u0627\u0644\u0641\u0648\u0636\u0649 (Chaos Factor):"));
        body.Append(FormulaBox("STL = BaseThreat * (1 + ChaosFactor_t) * Random(0.5, 1.5)"));

        body.Append(H2("\u0627\u0644\u0634\u0641\u0631\u0629 \u0627\u0644\u0648\u0647\u0645\u064a\u0629"));
        body.Append(CodeBlock(new string[] {
            "FUNCTION ChaoticBot_Decide(grid, players, cards, gold, hp, turn):",
            "    IF turn % 2 == 0 THEN",
            "        currentMode = RANDOM_SELECT({AGGRESSIVE, DEFENSIVE, MIXED})",
            "    END IF",
            "    chaosFactor = RANDOM(0.5, 1.5)",
            "    stl = BASE_THREAT(hp, players) * chaosFactor",
            "    SWITCH currentMode:",
            "        CASE AGGRESSIVE:",
            "            weights = [0.40, 0.30, 0.20, 0.10]",
            "            RETURN WEIGHTED_RANDOM([Attack, Sabotage, RandomMove, Feint], weights)",
            "        CASE DEFENSIVE:",
            "            weights = [0.35, 0.25, 0.25, 0.15]",
            "            RETURN WEIGHTED_RANDOM([BuildWall, Trap, Heal, Fortify], weights)",
            "        CASE MIXED:",
            "            weights = [0.30, 0.25, 0.25, 0.20]",
            "            RETURN WEIGHTED_RANDOM([RandomMove, SurpriseAtk, SurpriseDef, Gather], weights)",
            "    END SWITCH",
            "END FUNCTION"
        }));

        // Comparative Analysis
        body.Append(H1("\u0627\u0644\u062a\u062d\u0644\u064a\u0644 \u0627\u0644\u0645\u0642\u0627\u0631\u0646 \u0648\u0627\u0644\u062a\u0648\u0635\u064a\u0627\u062a", "_Toc005"));
        body.Append(ArP("\u064a\u0648\u0636\u062d \u0627\u0644\u062c\u062f\u0648\u0644 \u0627\u0644\u062a\u0627\u0644\u064a \u0627\u0644\u0645\u0642\u0627\u0631\u0646\u0629 \u0627\u0644\u0634\u0627\u0645\u0644\u0629 \u0628\u064a\u0646 \u0627\u0644\u0634\u062e\u0635\u064a\u0627\u062a \u0627\u0644\u062b\u0644\u0627\u062b \u0645\u0646 \u062d\u064a\u062b \u0627\u0644\u0633\u0644\u0648\u0643 \u0648\u0627\u0644\u0627\u0633\u062a\u0631\u0627\u062a\u064a\u062c\u064a\u0627\u062a:"));
        AddComparisonTable(body);

        body.Append(H2("\u0645\u0644\u062e\u0635 \u0627\u0644\u0645\u0639\u0627\u062f\u0644\u0627\u062a \u0627\u0644\u0627\u062d\u062a\u0645\u0627\u0644\u064a\u0629"));
        body.Append(ArP("\u062c\u0645\u064a\u0639 \u0627\u0644\u0634\u062e\u0635\u064a\u0627\u062a \u062a\u0634\u062a\u0631\u0643 \u0641\u064a \u0627\u0644\u0645\u0639\u0627\u062f\u0644\u0629 \u0627\u0644\u0623\u0633\u0627\u0633\u064a\u0629 \u0644\u062d\u0633\u0627\u0628 \u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u062a\u0647\u062f\u064a\u062f \u0627\u0644\u0628\u0642\u0627\u0626\u064a\u060c \u0644\u0643\u0646 \u0645\u0639 \u0645\u0639\u0627\u0645\u0644\u0627\u062a \u0634\u062e\u0635\u064a\u0629 \u0645\u062e\u062a\u0644\u0641\u0629 (Alpha, Beta, Gamma):"));
        body.Append(FormulaBox("STL = (HPmax - HPcurrent)/HPmax * alpha + (EnemyProximity/6) * beta + (ResourceRatio) * gamma"));
        body.Append(ArP("\u0645\u0639\u0627\u062f\u0644\u0629 \u0627\u0644\u0642\u0631\u0627\u0631 \u0627\u0644\u0646\u0647\u0627\u0626\u064a (Final Decision Score) \u062a\u062c\u0645\u0639 \u0628\u064a\u0646 \u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u062a\u0647\u062f\u064a\u062f \u0648\u0627\u0644\u0623\u0648\u0644\u0648\u064a\u0629 \u0627\u0644\u0634\u062e\u0635\u064a\u0629:"));
        body.Append(FormulaBox("Score(Action_i) = Priority(i) * (1 + STL) + RandomFactor_bot"));
        body.Append(ArP("\u062d\u064a\u062b Priority(i) \u0647\u0648 \u0627\u0644\u0648\u0632\u0646 \u0627\u0644\u0634\u062e\u0635\u064a \u0644\u0643\u0644 \u0625\u062c\u0631\u0627\u0621\u060c \u0648ThreatLevel \u0647\u0648 \u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u062a\u0647\u062f\u064a\u062f \u0627\u0644\u0645\u062d\u0633\u0648\u0628\u060c \u0648RandomFactor \u0647\u0648 \u0627\u0644\u0645\u0639\u0627\u0645\u0644 \u0627\u0644\u0639\u0634\u0648\u0627\u0626\u064a (0 \u0644\u0644\u0647\u062c\u0648\u0645\u064a \u0648\u0627\u0644\u062f\u0641\u0627\u0639\u064a\u060c \u0645\u062a\u063a\u064a\u0631 \u0644\u0644\u0641\u0648\u0636\u0648\u064a)."));

        body.Append(new Paragraph(new ParagraphProperties(new SectionProperties(
            new HeaderReference { Type = HeaderFooterValues.Default, Id = headerId },
            new FooterReference { Type = HeaderFooterValues.Default, Id = footerId },
            new PageSize { Width = (UInt32Value)(uint)A4W, Height = (UInt32Value)(uint)A4H },
            new PageMargin { Top = 1800, Right = 1440, Bottom = 1440, Left = 1440, Header = 720, Footer = 720 }))));
    }

    private static void AddBackcoverSection(Body body, string backBgId, ref uint prId)
    {
        body.Append(new Paragraph(new Run(CreateFloatingBackground(backBgId, prId++, "BackBg"))));
        body.Append(new Paragraph(
            new ParagraphProperties(new SpacingBetweenLines { Before = "6000" },
                new Justification { Val = JustificationValues.Center }),
            new Run(new RunProperties(
                    new RightToLeftText(),
                    new FontSize { Val = "48" }, new FontSizeComplexScript { Val = "48" },
                    new Bold(), new BoldComplexScript(),
                    new Color { Val = Colors.CoverText },
                    new RunFonts { ComplexScript = "Arial" }),
                new Text("Kingdoms of Chaos"))));
        body.Append(new Paragraph(
            new ParagraphProperties(new SpacingBetweenLines { Before = "400" },
                new Justification { Val = JustificationValues.Center }),
            new Run(new RunProperties(
                    new RightToLeftText(),
                    new FontSize { Val = "24" }, new FontSizeComplexScript { Val = "24" },
                    new Color { Val = Colors.Secondary },
                    new RunFonts { ComplexScript = "Arial" }),
                new Text("\u062a\u0645 \u062a\u0635\u0645\u064a\u0645 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a \u0644\u0644\u0641\u0648\u0636\u0649 \u0627\u0644\u0627\u0633\u062a\u0631\u0627\u062a\u064a\u062c\u064a\u0629"))));
        body.Append(new Paragraph(
            new ParagraphProperties(new SpacingBetweenLines { Before = "200" },
                new Justification { Val = JustificationValues.Center }),
            new Run(new RunProperties(
                    new FontSize { Val = "18" }, new FontSizeComplexScript { Val = "18" },
                    new Color { Val = "808080" }),
                new Text("2025 - \u0648\u062b\u064a\u0642\u0629 \u062a\u0635\u0645\u064a\u0645 \u062a\u0642\u0646\u064a\u0629"))));
        body.Append(new SectionProperties(
            new PageSize { Width = (UInt32Value)(uint)A4W, Height = (UInt32Value)(uint)A4H },
            new PageMargin { Top = 0, Right = 0, Bottom = 0, Left = 0, Header = 0, Footer = 0 }));
    }

    // ========================================================================
    // Factory Helpers
    // ========================================================================
    private static int _bookmarkId = 0;

    private static Paragraph H1(string text, string bookmarkName)
    {
        int id = ++_bookmarkId;
        return new Paragraph(
            new ParagraphProperties(new ParagraphStyleId { Val = "Heading1" }, new BiDi()),
            new BookmarkStart { Id = id.ToString(), Name = bookmarkName },
            new Run(new RunProperties(new RightToLeftText(), new RunFonts { ComplexScript = "Arial" }), new Text(text)),
            new BookmarkEnd { Id = id.ToString() });
    }

    private static Paragraph H2(string text) => new Paragraph(
        new ParagraphProperties(new ParagraphStyleId { Val = "Heading2" }, new BiDi()),
        new Run(new RunProperties(new RightToLeftText(), new RunFonts { ComplexScript = "Arial" }), new Text(text)));

    private static Paragraph H3(string text) => new Paragraph(
        new ParagraphProperties(new ParagraphStyleId { Val = "Heading3" }, new BiDi()),
        new Run(new RunProperties(new RightToLeftText(), new RunFonts { ComplexScript = "Arial" }), new Text(text)));

    private static Paragraph ArP(string text) => new Paragraph(
        new ParagraphProperties(new BiDi()),
        new Run(new RunProperties(
                new RightToLeftText(),
                new RunFonts { ComplexScript = "Arial" },
                new FontSizeComplexScript { Val = "24" }),
            new Text(text) { Space = SpaceProcessingModeValues.Preserve }));

    private static Paragraph Bullet(string text) => new Paragraph(
        new ParagraphProperties(
            new BiDi(),
            new NumberingProperties(new NumberingLevelReference { Val = 0 }, new NumberingId { Val = 1 })),
        new Run(new RunProperties(
                new RightToLeftText(),
                new RunFonts { ComplexScript = "Arial" },
                new FontSizeComplexScript { Val = "22" }),
            new Text(text) { Space = SpaceProcessingModeValues.Preserve }));

    private static Paragraph FormulaBox(string formula) => new Paragraph(
        new ParagraphProperties(
            new BiDi(),
            new Justification { Val = JustificationValues.Center },
            new SpacingBetweenLines { Before = "160", After = "160" },
            new Shading { Val = ShadingPatternValues.Clear, Fill = Colors.CodeBg },
            new Indentation { Left = "720", Right = "720" }),
        new Run(new RunProperties(
                new RunFonts { Ascii = "Cambria Math", HighAnsi = "Cambria Math" },
                new FontSize { Val = "22" },
                new Color { Val = Colors.Mid }),
            new Text(formula)));

    private static Table MakeWeightTable(string[,] data)
    {
        var tbl = new Table(new TableProperties(
            new TableWidth { Width = "5000", Type = TableWidthUnitValues.Pct },
            new BiDiVisual(),
            new TableBorders(
                new TopBorder { Val = BorderValues.Single, Size = 12, Color = Colors.Primary },
                new BottomBorder { Val = BorderValues.Single, Size = 12, Color = Colors.Primary },
                new LeftBorder { Val = BorderValues.Nil },
                new RightBorder { Val = BorderValues.Nil },
                new InsideHorizontalBorder { Val = BorderValues.Single, Size = 4, Color = Colors.Border })),
            new TableGrid(new GridColumn { Width = "5000" }, new GridColumn { Width = "5000" }));

        var headerRow = new TableRow();
        headerRow.Append(new TableRowProperties(new TableHeader()));
        headerRow.Append(MakeCell("\u0627\u0644\u0625\u062c\u0631\u0627\u0621", true));
        headerRow.Append(MakeCell("\u0627\u0644\u0648\u0632\u0646 \u0627\u0644\u0627\u062d\u062a\u0645\u0627\u0644\u064a", true));
        tbl.Append(headerRow);

        for (int i = 0; i < data.GetLength(0); i++)
        {
            var row = new TableRow();
            row.Append(MakeCell(data[i, 0], false));
            row.Append(MakeCell(data[i, 1], false));
            tbl.Append(row);
        }
        return tbl;
    }

    private static TableCell MakeCell(string text, bool isHeader)
    {
        var tcp = new TableCellProperties(
            new TableCellWidth { Width = "0", Type = TableWidthUnitValues.Auto });
        if (isHeader)
            tcp.Append(new Shading { Val = ShadingPatternValues.Clear, Fill = Colors.TableHeader });

        var rpr = new RunProperties(
            new RightToLeftText(),
            new RunFonts { ComplexScript = "Arial" },
            new FontSize { Val = "22" }, new FontSizeComplexScript { Val = "22" },
            new Color { Val = isHeader ? Colors.Dark : Colors.BodyText });
        if (isHeader) rpr.Append(new Bold());

        return new TableCell(tcp, new Paragraph(
            new ParagraphProperties(new BiDi(), new Justification { Val = JustificationValues.Center }),
            new Run(rpr, new Text(text))));
    }

    private static void AddComparisonTable(Body body)
    {
        var tbl = new Table(new TableProperties(
            new TableWidth { Width = "5000", Type = TableWidthUnitValues.Pct },
            new BiDiVisual(),
            new TableBorders(
                new TopBorder { Val = BorderValues.Single, Size = 12, Color = Colors.Primary },
                new BottomBorder { Val = BorderValues.Single, Size = 12, Color = Colors.Primary },
                new InsideHorizontalBorder { Val = BorderValues.Single, Size = 4, Color = Colors.Border })),
            new TableGrid(
                new GridColumn { Width = "2500" },
                new GridColumn { Width = "2500" },
                new GridColumn { Width = "2500" },
                new GridColumn { Width = "2500" }));

        var hr = new TableRow();
        hr.Append(new TableRowProperties(new TableHeader()));
        hr.Append(MakeCell("\u0627\u0644\u0645\u0639\u064a\u0627\u0631", true));
        hr.Append(MakeCell("\u0627\u0644\u0647\u062c\u0648\u0645\u064a", true));
        hr.Append(MakeCell("\u0627\u0644\u062f\u0641\u0627\u0639\u064a", true));
        hr.Append(MakeCell("\u0627\u0644\u0641\u0648\u0636\u0648\u064a", true));
        tbl.Append(hr);

        string[,] data = {
            { "\u0623\u0648\u0644\u0648\u064a\u0629 \u0627\u0644\u0647\u062c\u0648\u0645", "95%", "10%", "33%" },
            { "\u0623\u0648\u0644\u0648\u064a\u0629 \u0627\u0644\u062f\u0641\u0627\u0639", "5%", "85%", "33%" },
            { "\u0627\u0644\u062a\u0639\u0642\u064a\u062f \u0627\u0644\u062d\u0633\u0627\u0628\u064a", "\u0645\u0646\u062e\u0641\u0636", "\u0645\u062a\u0648\u0633\u0637", "\u0639\u0627\u0644\u064d" },
            { "\u0627\u0644\u0642\u062f\u0631\u0629 \u0639\u0644\u0649 \u0627\u0644\u062a\u0643\u064a\u0641", "\u0645\u0646\u062e\u0641\u0636\u0629", "\u0645\u062a\u0648\u0633\u0637\u0629", "\u0639\u0627\u0644\u064a\u0629" },
            { "\u0627\u0644\u0645\u0648\u062b\u0648\u0642\u064a\u0629", "100%", "100%", "\u0645\u062a\u063a\u064a\u0631\u0629" },
            { "\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0645\u0648\u0627\u0631\u062f", "\u0625\u0646\u0641\u0627\u0642 \u0643\u0627\u0645\u0644", "\u062a\u0643\u062f\u064a\u0633", "\u0639\u0634\u0648\u0627\u0626\u064a" }
        };

        for (int i = 0; i < data.GetLength(0); i++)
        {
            var row = new TableRow();
            for (int j = 0; j < 4; j++)
                row.Append(MakeCell(data[i, j], false));
            tbl.Append(row);
        }
        body.Append(tbl);
    }

    private static Table CodeBlock(string[] lines)
    {
        var table = new Table(new TableProperties(
            new TableWidth { Width = "5000", Type = TableWidthUnitValues.Pct },
            new TableBorders(
                new TopBorder { Val = BorderValues.Single, Size = 8, Color = Colors.Mid },
                new BottomBorder { Val = BorderValues.Single, Size = 8, Color = Colors.Mid },
                new LeftBorder { Val = BorderValues.Single, Size = 8, Color = Colors.Mid },
                new RightBorder { Val = BorderValues.Single, Size = 8, Color = Colors.Mid }),
            new Shading { Val = ShadingPatternValues.Clear, Fill = Colors.CodeBg }),
            new TableGrid(new GridColumn { Width = "10000" }));

        foreach (var ln in lines)
        {
            var cell = new TableCell(
                new TableCellProperties(
                    new TableCellWidth { Width = "10000", Type = TableWidthUnitValues.Dxa },
                    new Shading { Val = ShadingPatternValues.Clear, Fill = Colors.CodeBg }),
                new Paragraph(
                    new ParagraphProperties(
                        new SpacingBetweenLines { Before = "20", After = "20" },
                        new Justification { Val = JustificationValues.Left }),
                    new Run(new RunProperties(
                            new RunFonts { Ascii = "Consolas", HighAnsi = "Consolas" },
                            new FontSize { Val = "18" },
                            new Color { Val = Colors.Mid }),
                        new Text(ln))));
            table.Append(new TableRow(cell));
        }
        return table;
    }

    private static string AddImage(MainDocumentPart mp, string path)
    {
        var ip = mp.AddImagePart(ImagePartType.Png);
        using var fs = new FileStream(path, FileMode.Open);
        ip.FeedData(fs); return mp.GetIdOfPart(ip);
    }

    private static Drawing CreateFloatingBackground(string imgId, uint prId, string name)
    {
        return new Drawing(new DW.Anchor(
            new DW.SimplePosition { X = 0, Y = 0 },
            new DW.HorizontalPosition(new DW.PositionOffset("0")) { RelativeFrom = DW.HorizontalRelativePositionValues.Page },
            new DW.VerticalPosition(new DW.PositionOffset("0")) { RelativeFrom = DW.VerticalRelativePositionValues.Page },
            new DW.Extent { Cx = A4WE, Cy = A4HE },
            new DW.EffectExtent { LeftEdge = 0, TopEdge = 0, RightEdge = 0, BottomEdge = 0 },
            new DW.WrapNone(),
            new DW.DocProperties { Id = prId, Name = name },
            new DW.NonVisualGraphicFrameDrawingProperties(new A.GraphicFrameLocks { NoChangeAspect = true }),
            new A.Graphic(new A.GraphicData(
                new PIC.Picture(
                    new PIC.NonVisualPictureProperties(
                        new PIC.NonVisualDrawingProperties { Id = 0, Name = $"{name}.png" },
                        new PIC.NonVisualPictureDrawingProperties()),
                    new PIC.BlipFill(new A.Blip { Embed = imgId }, new A.Stretch(new A.FillRectangle())),
                    new PIC.ShapeProperties(
                        new A.Transform2D(new A.Offset { X = 0, Y = 0 }, new A.Extents { Cx = A4WE, Cy = A4HE }),
                        new A.PresetGeometry { Preset = A.ShapeTypeValues.Rectangle })))
            { Uri = "http://schemas.openxmlformats.org/drawingml/2006/picture" }))
        {
            DistanceFromTop = 0, DistanceFromBottom = 0, DistanceFromLeft = 0, DistanceFromRight = 0,
            SimplePos = false, RelativeHeight = 251658240, BehindDoc = true,
            Locked = false, LayoutInCell = true, AllowOverlap = true
        });
    }

    private static void AddNumbering(MainDocumentPart mp)
    {
        var np = mp.AddNewPart<NumberingDefinitionsPart>();
        np.Numbering = new Numbering(
            new AbstractNum(new Level(
                new NumberingFormat { Val = NumberFormatValues.Bullet },
                new LevelText { Val = "\u2022" },
                new LevelJustification { Val = LevelJustificationValues.Right },
                new ParagraphProperties(new Indentation { Left = "720", Hanging = "360" })
            ) { LevelIndex = 0 }) { AbstractNumberId = 1 },
            new NumberingInstance(new AbstractNumId { Val = 1 }) { NumberID = 1 });
    }

    private static void SetUpdateFieldsOnOpen(MainDocumentPart mp)
    {
        var sp = mp.DocumentSettingsPart ?? mp.AddNewPart<DocumentSettingsPart>();
        sp.Settings = new Settings(new UpdateFieldsOnOpen { Val = true }, new DisplayBackgroundShape());
    }
}

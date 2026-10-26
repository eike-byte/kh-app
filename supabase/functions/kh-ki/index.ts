// Kita-Helfer: KI-Gestaltung für Portfolioseiten und Arbeitsblätter.
// Läuft als Supabase Edge Function "kh-ki". Der Anthropic-Schlüssel liegt nur hier
// (Secret ANTHROPIC_API_KEY), nie in der App. Nur angemeldete Nutzer dürfen aufrufen.
// Die App schickt keine Fotos und keine Namen: das Kind heißt hier immer {Name}.
import Anthropic from "npm:@anthropic-ai/sdk";

const client = new Anthropic(); // liest ANTHROPIC_API_KEY aus den Secrets

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const THEMES = ["", "bagger", "feuerwehr", "dino", "weltraum", "meer", "tiere", "natur", "fussball", "herbst", "maerchen"];
const STIL = {
  palette: ["", "sonne", "meer", "wiese", "beere", "bonbon", "herbst", "nacht", "regenbogen", "pastell", "feuer", "wald", "baustelle"],
  hintergrund: ["weiss", "uni", "punkte", "karo", "streifen", "konfetti", "sterne", "wolken", "wellen", "herzen"],
  rahmen: ["keiner", "linie", "doppelt", "naht", "band", "kreise", "wimpel", "ecken"],
  titel: ["schlicht", "banner", "schild", "wolke", "bunt", "welle"],
  foto: ["rund", "polaroid", "klebeband", "oval", "blob", "rahmen"],
  text: ["schlicht", "zettel", "sprechblase", "karte", "tafel"],
  schrift: ["baloo", "fredoka", "hand", "kreide"],
};
const BLOCK_TYPES = ["titel", "name", "anleitung", "zaehlen", "nachspuren", "schwung", "malfeld", "linien", "ausmalen"];

const SYSTEM = `Du gestaltest Seiten für eine Erzieherin in einer deutschen Kita (Kinder von 1 bis 6 Jahren).
Sie beschreibt einen Wunsch, und du lieferst die neue Fassung der Seite als JSON nach dem vorgegebenen Schema.

Grundsätze:
- Ändere nur, was der Wunsch betrifft. Alles andere übernimmst du genau so, wie es in "aktuell" steht.
- Schreib warm, einfach und in kindgerechtem Deutsch. In Portfoliotexten sprichst du das Kind mit "du" an.
- Das Kind heißt im Text immer {Name}, sein Alter ist {Alter}. Erfinde keine Namen und keine Beobachtungen, die die Erzieherin nicht genannt hat; wo Inhalte fehlen, lass eine kurze Lücke mit "…".
- In "antwort" sagst du der Erzieherin in ein bis zwei Sätzen, was du geändert hast.

Motive:
- Die App hat eine Bibliothek fertiger Motive (Liste in der Anfrage). Nutze sie, wenn eines passt.
- Fehlt ein passendes Motiv (zum Beispiel ein Traktor, ein Einhorn oder eine Giraffe), zeichne bis zu drei neue in "neue_motive".
- Ein neues Motiv ist SVG-Inhalt ohne das umschließende <svg>-Element, gezeichnet in einem 100×100-Raster mit etwa 6 Einheiten Rand.
  Erlaubt sind nur path, circle, ellipse, rect, polygon, polyline, line und g. Kein Text, keine Verläufe, keine Filter, keine Bilder, keine Stile.
  Jede Form bekommt stroke="#1C2633" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" und eine kräftige, freundliche Füllfarbe als fill.
  Zeichne einfach und klar erkennbar wie ein Kinderbuch-Aufkleber, mit 5 bis 25 Formen und großen Flächen, die man auch gut ausmalen kann.
- Auf ein neues Motiv verweist du mit "neu:0", "neu:1" usw. (in der Reihenfolge von "neue_motive"), auf eines aus der Bibliothek mit seinem Schlüssel.
- "deko_motive" sind die Motive, die als Schmuck auf der Seite erscheinen (höchstens 4). Leer lassen heißt: die Motive des Themas.`;

const PF_HINT = `Portfolioseite (A4 hochkant, 794 × 1123 Pixel). Felder: titel (Überschrift), text, bildunterschriften (nur Fotoseite, genau 4 Einträge, sonst leer), thema, dichte (1 wenig, 2 mittel, 3 viel Schmuck: bei 3 erscheint zusätzlich eine Motivreihe unter der Überschrift), deko_motive, neue_motive, stil.
Layouts: "lern" Lerngeschichte als Brief an das Kind; "kann" Liste "Das kann ich schon", eine Zeile pro Punkt; "foto" Fotoseite mit vier Bildunterschriften; "ich" Steckbrief, eine Zeile pro Punkt im Format "Frage: Antwort".

Gestaltung (stil): Du bist hier frei wie eine kreative Grafikerin für Kinderbücher. Stimme alles aufeinander ab und auf das Kind und den Wunsch.
- palette: Farbwelt. sonne, meer, wiese, beere, bonbon, herbst, nacht (Sternennacht), regenbogen, pastell, feuer (Feuerwehr), wald, baustelle. "" heißt Farben des Themas.
- hintergrund: weiss, uni (zart getönt), punkte, karo, streifen, konfetti, sterne, wolken, wellen (unten), herzen.
- rahmen: keiner, linie, doppelt, naht (genähter Stoffrand), band (breiter Farbrand), kreise (bunte Punkte rundum), wimpel (Wimpelkette oben), ecken (Fotoalbum-Ecken).
- titel: schlicht, banner (Stoffband), schild (schräges Farbschild), wolke, bunt (jeder Buchstabe andere Farbe, leicht gedreht), welle (Wellenlinie darunter).
- foto: rund (abgerundet), polaroid (schräg mit weißem Rand), klebeband, oval, blob (Klecksform), rahmen (doppelter Farbrahmen).
- text: schlicht, zettel (linierter Notizzettel), sprechblase, karte (getönte Karte), tafel (grüne Kreidetafel).
- schrift: baloo (rund, kräftig), fredoka (weich), hand (Handschrift), kreide (verspielte Handschrift).
- variante: Anordnung. lern 1 großes Foto links, 2 großes Foto rechts, 3 drei Fotos nebeneinander; kann 1 Foto oben, 2 Foto neben der Liste, 3 Foto unten; foto 1 Raster, 2 Collage mit großem Foto oben, 3 verstreut; ich 1 Foto in der Mitte, 2 Foto neben dem Steckbrief.
- zitat: optional ein kurzer Satz des Kindes in einer Sprechblase (nur wenn die Erzieherin ihn genannt hat oder ausdrücklich eine Sprechblase wünscht, sonst "").
- aufkleber: optional frei platzierte Motive (Bibliothek oder neu:N) mit x und y in Prozent der Seite (Mittelpunkt), groesse in Pixeln (30 bis 260) und drehung in Grad (-40 bis 40). Sind welche angegeben, ersetzen sie die automatische Deko in den Ecken. Setze sie in freie Bereiche: Ränder, Ecken, neben die Überschrift, zwischen Fotos und Text. Fotos liegen ungefähr zwischen y 18 und 50 Prozent, der Text darunter; dort nur kleine Aufkleber am Rand.
Wenn die Seite noch keinen Stil hat oder der Wunsch die Gestaltung betrifft, gestalte mutig und abwechslungsreich. Betrifft der Wunsch nur den Text, behalte den aktuellen Stil bei.`;

const AB_HINT = `Arbeitsblatt für Kinder im Kita-Alter, das ausgedruckt wird. Es besteht aus Bausteinen von oben nach unten.
Jeder Baustein hat typ, text, option, reihen, hoechstens. Felder, die ein Typ nicht nutzt, sind "" bzw. 0.
- titel: text = Überschrift
- name: Zeile für Name und Datum
- anleitung: text = kurze Aufgabe für die vorlesende Erzieherin
- zaehlen: option = Symbol (kreis, stern, herz, blume, apfel, fisch, ein Bibliotheksmotiv oder neu:N), reihen 1–8, hoechstens 1–10
- nachspuren: text = Wort oder Buchstaben zum Nachspuren, option = gross oder mittel
- schwung: option = welle, zacke, bogen, schlaufe oder treppe, reihen 1–6
- malfeld: text = Aufgabe, option = gross oder klein
- linien: reihen 1–10 Schreiblinien
- ausmalen: option = Motiv (Bibliothek oder neu:N), text = Aufgabe
Alles muss auf eine A4-Seite passen. Ungefähre Höhen in Pixeln, verfügbar sind etwa 1000:
titel 60, name 40, anleitung 50, zaehlen 70 je Reihe, nachspuren 120 je 9 Zeichen (gross) bzw. 84 je 15 Zeichen (mittel), schwung 96 je Reihe, malfeld 260 (klein) bzw. 460 (gross), linien 60 je Reihe, ausmalen 480.
Für Kinder unter 5 eher zählen bis 5, Schwungübungen, Ausmalen und Malfelder; Buchstaben und Wörter eher für Vorschulkinder.`;

const motifSchema = {
  type: "object",
  properties: { name: { type: "string" }, svg: { type: "string" } },
  required: ["name", "svg"],
  additionalProperties: false,
};
function schemaFor(type: string) {
  const common = {
    antwort: { type: "string" },
    titel: { type: "string" },
    thema: { type: "string", enum: THEMES },
    deko_motive: { type: "array", items: { type: "string" } },
    neue_motive: { type: "array", items: motifSchema },
  };
  if (type === "ab") {
    return {
      type: "object",
      properties: {
        ...common,
        bausteine: {
          type: "array",
          items: {
            type: "object",
            properties: {
              typ: { type: "string", enum: BLOCK_TYPES },
              text: { type: "string" },
              option: { type: "string" },
              reihen: { type: "integer" },
              hoechstens: { type: "integer" },
            },
            required: ["typ", "text", "option", "reihen", "hoechstens"],
            additionalProperties: false,
          },
        },
      },
      required: ["antwort", "titel", "thema", "deko_motive", "neue_motive", "bausteine"],
      additionalProperties: false,
    };
  }
  return {
    type: "object",
    properties: {
      ...common,
      text: { type: "string" },
      bildunterschriften: { type: "array", items: { type: "string" } },
      dichte: { type: "integer" },
      stil: {
        type: "object",
        properties: {
          ...Object.fromEntries(Object.entries(STIL).map(([k, v]) => [k, { type: "string", enum: v }])),
          variante: { type: "integer" },
          zitat: { type: "string" },
          aufkleber: {
            type: "array",
            items: {
              type: "object",
              properties: {
                motiv: { type: "string" },
                x: { type: "integer" },
                y: { type: "integer" },
                groesse: { type: "integer" },
                drehung: { type: "integer" },
              },
              required: ["motiv", "x", "y", "groesse", "drehung"],
              additionalProperties: false,
            },
          },
        },
        required: [...Object.keys(STIL), "variante", "zitat", "aufkleber"],
        additionalProperties: false,
      },
    },
    required: ["antwort", "titel", "text", "bildunterschriften", "thema", "dichte", "deko_motive", "neue_motive", "stil"],
    additionalProperties: false,
  };
}

async function ask(params: Record<string, unknown>) {
  // Lehnt das Modell eine harmlose Anfrage fälschlich ab, springt serverseitig ein anderes Modell ein.
  try {
    return await client.beta.messages.create({
      ...params,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    } as any);
  } catch (e) {
    if (e instanceof Anthropic.BadRequestError) return await client.beta.messages.create(params as any);
    throw e;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return reply(405, { error: "method" });
  if (!Deno.env.get("ANTHROPIC_API_KEY")) return reply(500, { error: "kein_schluessel" });

  let input: any;
  try { input = await req.json(); } catch { return reply(400, { error: "eingabe" }); }
  const type = input?.type === "ab" ? "ab" : "pf";
  const wish = String(input?.wunsch || "").slice(0, 1500).trim();
  if (!wish) return reply(400, { error: "eingabe" });

  const request = {
    seitentyp: type === "ab" ? "Arbeitsblatt" : "Portfolioseite",
    layout: type === "pf" ? String(input.layout || "") : undefined,
    alter_des_kindes: input.alter || undefined,
    bibliothek: input.bibliothek || {},
    aktuell: input.aktuell || {},
  };
  const params = {
    model: "claude-opus-5-5",
    max_tokens: 16000,
    output_config: { effort: "medium", format: { type: "json_schema", schema: schemaFor(type) } },
    system: SYSTEM + "\n\n" + (type === "ab" ? AB_HINT : PF_HINT),
    messages: [{
      role: "user",
      content: `<seite>\n${JSON.stringify(request, null, 1).slice(0, 20000)}\n</seite>\n\n<wunsch>\n${wish}\n</wunsch>`,
    }],
  };

  try {
    const msg: any = await ask(params);
    if (msg.stop_reason === "refusal") return reply(422, { error: "abgelehnt" });
    if (msg.stop_reason === "max_tokens") return reply(502, { error: "zu_lang" });
    const text = (msg.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
    return reply(200, { ergebnis: JSON.parse(text) });
  } catch (e) {
    console.error(e);
    if (e instanceof Anthropic.AuthenticationError) return reply(500, { error: "schluessel_falsch" });
    if (e instanceof Anthropic.RateLimitError) return reply(429, { error: "zu_viele" });
    if (e instanceof Anthropic.APIError && e.status === 400 && /credit|balance/i.test(e.message)) return reply(402, { error: "guthaben" });
    return reply(502, { error: "fehler" });
  }
});

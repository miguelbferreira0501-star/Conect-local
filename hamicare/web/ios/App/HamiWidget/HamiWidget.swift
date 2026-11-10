// Widget do Hami na tela do iPhone: o Hami, as missões de hoje, a água e a ofensiva.
// Os dados vêm do app pelo App Group (group.com.hamicare.app), gravados pelo plugin HamiWidget.
import SwiftUI
import WidgetKit

struct HamiEntry: TimelineEntry {
    let date: Date
    let name: String
    let line: String
    let done: Int
    let total: Int
    let water: String
    let streak: Int

    static let sample = HamiEntry(date: Date(), name: "Hami", line: "Bora cuidar de você hoje?", done: 2, total: 5, water: "1 L de 2 L", streak: 3)
}

struct HamiProvider: TimelineProvider {
    func placeholder(in context: Context) -> HamiEntry { .sample }

    func getSnapshot(in context: Context, completion: @escaping (HamiEntry) -> Void) {
        completion(read() ?? .sample)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<HamiEntry>) -> Void) {
        let next = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date().addingTimeInterval(1800)
        completion(Timeline(entries: [read() ?? .sample], policy: .after(next)))
    }

    private func read() -> HamiEntry? {
        guard let data = UserDefaults(suiteName: "group.com.hamicare.app")?.data(forKey: "hamiWidget"),
              let o = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] else { return nil }
        return HamiEntry(
            date: Date(),
            name: o["name"] as? String ?? "Hami",
            line: o["line"] as? String ?? "",
            done: (o["done"] as? NSNumber)?.intValue ?? 0,
            total: (o["total"] as? NSNumber)?.intValue ?? 0,
            water: o["water"] as? String ?? "",
            streak: (o["streak"] as? NSNumber)?.intValue ?? 0
        )
    }
}

private let ink = Color(red: 0.23, green: 0.18, blue: 0.29)
private let cream = Color(red: 1.0, green: 0.957, blue: 0.886)

struct HamiWidgetView: View {
    var entry: HamiEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        Group {
            if family == .systemSmall {
                VStack(spacing: 4) {
                    Image("Hami").resizable().scaledToFit().frame(maxHeight: 82)
                    HStack(spacing: 6) {
                        if entry.total > 0 { Text("\(entry.done)/\(entry.total)").font(.system(size: 15, weight: .heavy)).foregroundColor(.blue) }
                        if entry.streak > 0 { Text("🔥\(entry.streak)").font(.system(size: 14, weight: .bold)) }
                    }
                }
            } else {
                HStack(spacing: 12) {
                    Image("Hami").resizable().scaledToFit().frame(width: 96)
                    VStack(alignment: .leading, spacing: 4) {
                        Text(entry.name).font(.system(size: 18, weight: .heavy)).foregroundColor(ink)
                        if !entry.line.isEmpty { Text(entry.line).font(.system(size: 13)).foregroundColor(ink.opacity(0.8)).lineLimit(2) }
                        if entry.total > 0 { Text("\(entry.done)/\(entry.total) missões").font(.system(size: 15, weight: .bold)).foregroundColor(.blue) }
                        HStack(spacing: 10) {
                            if !entry.water.isEmpty { Text("💧 \(entry.water)") }
                            if entry.streak > 0 { Text("🔥 \(entry.streak) \(entry.streak == 1 ? "dia" : "dias")") }
                        }
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(ink.opacity(0.85))
                    }
                    Spacer(minLength: 0)
                }
            }
        }
        .hamiBackground()
    }
}

private extension View {
    @ViewBuilder
    func hamiBackground() -> some View {
        if #available(iOSApplicationExtension 17.0, *) {
            self.containerBackground(cream, for: .widget)
        } else {
            self.padding().background(cream)
        }
    }
}

@main
struct HamiWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "HamiWidget", provider: HamiProvider()) { entry in
            HamiWidgetView(entry: entry)
        }
        .configurationDisplayName("Hami")
        .description("O Hami, as missões de hoje, a água e a ofensiva.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

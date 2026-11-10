import Foundation
import Capacitor
#if canImport(WidgetKit)
import WidgetKit
#endif

/// Recebe do app o resumo do dia e guarda no "App Group" que o widget lê; depois pede para o widget redesenhar.
/// O App Group (group.com.hamicare.app) precisa estar ligado no app e no widget (passo a passo em docs/LOJAS.md).
@objc(HamiWidgetPlugin)
public class HamiWidgetPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "HamiWidgetPlugin"
    public let jsName = "HamiWidget"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "update", returnType: CAPPluginReturnPromise)
    ]

    static let group = "group.com.hamicare.app"
    static let key = "hamiWidget"

    @objc public func update(_ call: CAPPluginCall) {
        guard let data = try? JSONSerialization.data(withJSONObject: call.options ?? [:], options: []) else {
            call.reject("dados inválidos")
            return
        }
        guard let defaults = UserDefaults(suiteName: HamiWidgetPlugin.group) else {
            call.resolve(["saved": false])
            return
        }
        defaults.set(data, forKey: HamiWidgetPlugin.key)
        #if canImport(WidgetKit)
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
        }
        #endif
        call.resolve(["saved": true])
    }
}

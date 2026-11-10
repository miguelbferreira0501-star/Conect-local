// swift-tools-version: 5.9
import PackageDescription

// Plugin local do HamiCare (o Capacitor inclui sozinho no projeto do iPhone ao rodar `npx cap sync ios`).
let package = Package(
    name: "HamiWidget",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "HamiWidget",
            targets: ["HamiWidgetPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "8.0.0")
    ],
    targets: [
        .target(
            name: "HamiWidgetPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm")
            ],
            path: "ios/Sources/HamiWidgetPlugin")
    ]
)

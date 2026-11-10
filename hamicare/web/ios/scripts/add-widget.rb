#!/usr/bin/env ruby
# Liga o widget do Hami no projeto do iPhone (rodado pelo Codemagic quando HAMI_WIDGET=1, depois do `npx cap sync ios`).
# - Cria o alvo "HamiWidget" (extensão WidgetKit) com os arquivos de ios/App/HamiWidget.
# - Liga o App Group (group.com.hamicare.app) no app e no widget, para os dois lerem os mesmos dados.
# - Coloca o widget dentro do app (Embed Foundation Extensions).
# Antes, no site da Apple: crie o App Group e ligue em com.hamicare.app e com.hamicare.app.widget (docs/LOJAS.md).
# Rodar duas vezes não duplica nada.
require 'xcodeproj'

APP_DIR = File.expand_path('../App', __dir__)
project = Xcodeproj::Project.open(File.join(APP_DIR, 'App.xcodeproj'))
if project.targets.any? { |t| t.name == 'HamiWidget' }
  puts 'Widget já está no projeto.'
  exit 0
end

app = project.targets.find { |t| t.name == 'App' } or abort('Alvo App não encontrado')
app_cfg = app.build_configurations.first.build_settings
widget_id = "#{app_cfg['PRODUCT_BUNDLE_IDENTIFIER'] || 'com.hamicare.app'}.widget"

widget = project.new_target(:app_extension, 'HamiWidget', :ios, '16.0', nil, :swift)
group = project.main_group.new_group('HamiWidget', 'HamiWidget')
swift = group.new_file('HamiWidget.swift')
assets = group.new_file('Assets.xcassets')
group.new_file('Info.plist')
group.new_file('HamiWidget.entitlements')
widget.add_file_references([swift])
widget.add_resources([assets])
widget.add_system_frameworks(%w[WidgetKit SwiftUI])

widget.build_configurations.each do |c|
  base = app.build_configurations.find { |a| a.name == c.name }&.build_settings || app_cfg
  s = c.build_settings
  s['PRODUCT_BUNDLE_IDENTIFIER'] = widget_id
  s['PRODUCT_NAME'] = '$(TARGET_NAME)'
  s['INFOPLIST_FILE'] = 'HamiWidget/Info.plist'
  s['GENERATE_INFOPLIST_FILE'] = 'NO'
  s['CODE_SIGN_ENTITLEMENTS'] = 'HamiWidget/HamiWidget.entitlements'
  s['SWIFT_VERSION'] = '5.0'
  s['IPHONEOS_DEPLOYMENT_TARGET'] = '16.0'
  s['TARGETED_DEVICE_FAMILY'] = '1,2'
  s['SKIP_INSTALL'] = 'YES'
  s['LD_RUNPATH_SEARCH_PATHS'] = ['$(inherited)', '@executable_path/Frameworks', '@executable_path/../../Frameworks']
  s['ASSETCATALOG_COMPILER_WIDGET_BACKGROUND_COLOR_NAME'] = ''
  %w[MARKETING_VERSION CURRENT_PROJECT_VERSION CODE_SIGN_STYLE DEVELOPMENT_TEAM CODE_SIGN_IDENTITY].each do |k|
    s[k] = base[k] if base[k]
  end
end

# App Group também no app (o plugin grava os dados lá).
app.build_configurations.each { |c| c.build_settings['CODE_SIGN_ENTITLEMENTS'] = 'App/App.entitlements' }
app_group = project.main_group.find_subpath('App', false)
app_group.new_file('App.entitlements') if app_group && app_group.files.none? { |f| f.path == 'App.entitlements' }

# Widget vai dentro do app.
embed = app.copy_files_build_phases.find { |p| p.name == 'Embed Foundation Extensions' } || app.new_copy_files_build_phase('Embed Foundation Extensions')
embed.dst_subfolder_spec = '13'
bf = embed.add_file_reference(widget.product_reference, true)
bf.settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }
app.add_dependency(widget)

project.save
puts "Widget adicionado (#{widget_id})."

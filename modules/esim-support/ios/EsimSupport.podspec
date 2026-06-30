Pod::Spec.new do |s|
  s.name           = 'EsimSupport'
  s.version        = '1.0.0'
  s.summary        = 'Reports whether the device hardware supports eSIM.'
  s.description    = 'Local Expo module exposing CTCellularPlanProvisioning().supportsEmbeddedSIM.'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = { :ios => '13.4', :tvos => '13.4' }
  s.swift_version  = '5.4'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  # CoreTelephony provides CTCellularPlanProvisioning; link it explicitly so the
  # symbol resolves even if Swift autolink directives are stripped.
  s.frameworks     = 'CoreTelephony'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,swift}"
end

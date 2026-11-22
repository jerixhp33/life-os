const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withProguard(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const proguardFile = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'proguard-rules.pro'
      );
      if (fs.existsSync(proguardFile)) {
        let content = fs.readFileSync(proguardFile, 'utf8');
        const rules = `
# LifeOS Custom ProGuard / R8 Rules
-dontwarn expo.modules.av.**
-dontwarn expo.modules.core.interfaces.services.KeepAwakeManager
-dontwarn expo.modules.kotlin.types.AnyTypeProvider
-dontwarn expo.modules.kotlin.types.LazyKType
-keep class expo.modules.av.** { *; }
`;
        if (!content.includes('-dontwarn expo.modules.av.**')) {
          content += '\n' + rules;
          fs.writeFileSync(proguardFile, content, 'utf8');
        }
      }
      return config;
    },
  ]);
};

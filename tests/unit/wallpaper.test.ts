import {
  useWallpaperStore,
  WALLPAPER_PRESETS,
  DEFAULT_WALLPAPER_CONFIG,
  SCREEN_TARGET_LABELS,
} from '../../src/stores/wallpaperStore';

describe('Wallpaper Store & Presets', () => {
  beforeEach(async () => {
    await useWallpaperStore.getState().resetAll();
  });

  it('defines all required preset themes with valid circular palettes', () => {
    const requiredPresets = ['nova', 'starlight', 'midnight', 'sunset', 'aurora', 'custom'] as const;

    for (const id of requiredPresets) {
      const preset = WALLPAPER_PRESETS[id];
      expect(preset).toBeDefined();
      expect(preset.id).toBe(id);
      expect(preset.circles).toHaveLength(4);
      expect(preset.darkBg).toBeDefined();
      expect(preset.lightBg).toBeDefined();
    }
  });

  it('initializes with default signature nova configuration', () => {
    const config = useWallpaperStore.getState().getConfigForScreen();
    expect(config.preset).toBe('nova');
    expect(config.blurAmount).toBe(50);
    expect(config.vignette).toBe(true);
    expect(config.shapeOpacity).toBe(0.95);
  });

  it('updates global configuration properly', async () => {
    await useWallpaperStore.getState().setGlobalConfig({
      preset: 'starlight',
      blurAmount: 75,
      vignette: false,
    });

    const config = useWallpaperStore.getState().getConfigForScreen();
    expect(config.preset).toBe('starlight');
    expect(config.blurAmount).toBe(75);
    expect(config.vignette).toBe(false);
  });

  it('handles per-page overrides without mutating global config', async () => {
    await useWallpaperStore.getState().setGlobalConfig({ preset: 'nova' });

    // Set home page to starlight graffiti
    await useWallpaperStore.getState().setPageOverride('home', {
      preset: 'starlight',
      blurAmount: 30,
    });

    // Home should return its override
    const homeConfig = useWallpaperStore.getState().getConfigForScreen('home');
    expect(homeConfig.preset).toBe('starlight');
    expect(homeConfig.blurAmount).toBe(30);

    // Other screens (e.g. calendar) should continue using global config
    const calConfig = useWallpaperStore.getState().getConfigForScreen('calendar');
    expect(calConfig.preset).toBe('nova');
    expect(calConfig.blurAmount).toBe(50);
  });

  it('resets per-page override back to global', async () => {
    await useWallpaperStore.getState().setGlobalConfig({ preset: 'midnight' });
    await useWallpaperStore.getState().setPageOverride('finance', { preset: 'sunset' });

    expect(useWallpaperStore.getState().getConfigForScreen('finance').preset).toBe('sunset');

    await useWallpaperStore.getState().resetPageOverride('finance');
    expect(useWallpaperStore.getState().getConfigForScreen('finance').preset).toBe('midnight');
  });

  it('supports custom photo uri selection', async () => {
    await useWallpaperStore.getState().setPageOverride('goals', {
      preset: 'custom',
      customImageUri: 'file:///path/to/my-wallpaper.jpg',
    });

    const goalsConfig = useWallpaperStore.getState().getConfigForScreen('goals');
    expect(goalsConfig.preset).toBe('custom');
    expect(goalsConfig.customImageUri).toBe('file:///path/to/my-wallpaper.jpg');
  });

  it('has readable labels for all screen targets', () => {
    expect(SCREEN_TARGET_LABELS.global).toBe('All Screens (Default)');
    expect(SCREEN_TARGET_LABELS.home).toBe('Home Dashboard');
    expect(SCREEN_TARGET_LABELS.calendar).toBe('Calendar & Schedule');
    expect(SCREEN_TARGET_LABELS.goals).toBe('Goals & Milestones');
  });
});

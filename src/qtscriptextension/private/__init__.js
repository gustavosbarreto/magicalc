__setupPackage__("private");

private.loadLocale = function(locale) {
    if (locale == 'en') goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_en;
    if (locale == 'pt_BR') goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_pt_BR;
}

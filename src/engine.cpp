#include "engine.hpp"

#include <QScriptEngine>
#include <QLocale>
#include <QDebug>

Q_GLOBAL_STATIC(Engine, engine);

Engine::Engine()
    : QObject()
{
    scriptEngine = new QScriptEngine(this);
}

void Engine::initialize()
{
    scriptEngine->importExtension("private");
    scriptEngine->importExtension("goog");
    scriptEngine->evaluate(QString("private.loadLocale('%1');").arg(QLocale().name()));
}

QString Engine::toCurrency(qreal value) const
{
    return scriptEngine->evaluate(QString("(new goog.i18n.NumberFormat(goog.i18n.NumberFormat.Format.CURRENCY)).format(%1);").arg(value)).toString();
}

Engine *Engine::instance()
{
    return engine();
}

//scriptEngine.evaluate("var f = new goog.i18n.NumberFormat(goog.i18n.NumberFormat.Format.CURRENCY); print(f.format(1));");

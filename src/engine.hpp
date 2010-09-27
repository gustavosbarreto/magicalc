#ifndef _ENGINE_HPP
#define _ENGINE_HPP

#include <QObject>

class QScriptEngine;

class Engine: public QObject
{
    Q_OBJECT

public:
    Engine();

    void initialize();

    QString toCurrency(qreal value) const;

    static Engine *instance();

private:
    QScriptEngine *scriptEngine;
};

#endif

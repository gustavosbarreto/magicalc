#include <QApplication>
#include <QFontDatabase>
#include <QTranslator>
#include <QLibraryInfo>

#include "mainwindow.hpp"
#include "engine.hpp"

int main(int argc, char *argv[])
{
    QApplication app(argc, argv);

    QFontDatabase::addApplicationFont(":/resources/font.ttf");

    QTranslator qtTranslator;
    qtTranslator.load("qt_" + QLocale::system().name(),
                      QLibraryInfo::location(QLibraryInfo::TranslationsPath));
    app.installTranslator(&qtTranslator);

    Engine::instance()->initialize();

    MainWindow *mainWindow = new MainWindow;
    mainWindow->show();

    return app.exec();
}

#include <QApplication>
#include <QFontDatabase>
#include <QTranslator>
#include <QLibraryInfo>

#include "mainwindow.hpp"

int main(int argc, char *argv[])
{
	QApplication app(argc, argv);

	QFontDatabase::addApplicationFont(":/resources/font.ttf");

    QTranslator qtTranslator;
    qtTranslator.load("qt_" + QLocale::system().name(),
                       QLibraryInfo::location(QLibraryInfo::TranslationsPath));
    app.installTranslator(&qtTranslator);

	MainWindow *mainWindow = new MainWindow;
    mainWindow->show();
//    mainWindow->move(1000, 1000);

	return app.exec();
}

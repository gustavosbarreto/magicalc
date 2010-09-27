#include "mainwindow.hpp"
#include "parser.hpp"
#include "highlighter.hpp"
#include "engine.hpp"
#include "answercontroller.hpp"

#include <QTextLayout>
#include <QDebug>

MainWindow::MainWindow()
    : QMainWindow()
{
    ui.setupUi(this);

    Engine::instance()->initialize();

    answerController = new AnswerController(ui.answerColumn);

    connect(ui.textEdit, SIGNAL(textChanged()), SLOT(textChanged()));

    new Highlighter(ui.textEdit->document());
}

void MainWindow::textChanged()
{
    Parser p(ui.textEdit->textCursor().block().text());
    qDebug() << Engine::instance()->toCurrency(10);
}

#ifndef _MAINWINDOW_HPP
#define _MAINWINDOW_HPP

#include "ui_mainwindow.h"

class AnswerController;

class MainWindow: public QMainWindow
{
    Q_OBJECT

public:
    MainWindow();

protected slots:
    void textChanged();

private:
    Ui::MainWindow ui;
    AnswerController *answerController;
};

#endif

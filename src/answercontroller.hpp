#ifndef _ANSWERCONTROLLER_HPP
#define _ANSWERCONTROLLER_HPP

#include <QObject>

class QTextEdit;

class AnswerController: public QObject
{
    Q_OBJECT

public:
    AnswerController(QTextEdit *txtEdit);

private:
    QTextEdit *textEdit;
};

#endif

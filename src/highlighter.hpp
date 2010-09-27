#ifndef _HIGHLIGHTER_HPP
#define _HIGHLIGHTER_HPP

#include <QSyntaxHighlighter>

class Highlighter: public QSyntaxHighlighter
{
public:
    Highlighter(QTextDocument *parent);

protected:
    virtual void highlightBlock(const QString &text);
};

#endif


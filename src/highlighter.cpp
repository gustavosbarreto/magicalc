#include "highlighter.hpp"
#include "parser.hpp"

#include <QDebug>

Highlighter::Highlighter(QTextDocument *parent)
    : QSyntaxHighlighter(parent)
{
}

void Highlighter::highlightBlock(const QString &text)
{
    Parser parser(text);
    QList<Token> tokens = parser.parse();
    foreach (const Token &t, tokens)
    {
        if (t.type() == Token::NumberTokenType)
            setFormat(t.index(), t.toString().length(), Qt::black);
        else if (t.type() == Token::CurrencySignTokenType)
            setFormat(t.index(), t.toString().length(), Qt::black);
        else if (t.type() == Token::OperatorTokenType)
            setFormat(t.index(), t.toString().length(), Qt::red);
        else if (t.type() == Token::StringTokenType)
            setFormat(t.index(), t.toString().length(), Qt::blue);
    }
}

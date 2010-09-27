#include "parser.hpp"

#include <QStringList>
#include <QLocale>
#include <QDebug>

Parser::Parser(const QString &expr)
    : d(new ParserData)
{
    d->expr = expr;
}

Parser::Parser(const Parser &other)
    : d(other.d)
{
}

QList<Token> Parser::parse()
{
    lexicalAnalysis(createGenericTokens());
    return d->tokens;
}

Parser &Parser::operator=(const Parser &other)
{
    d = other.d;
    return *this;
}

QList<Token> Parser::createGenericTokens()
{
    QList<Token> tokens;

    int i = -1;
    int index = -1;

    QStringList parts = d->expr.split(" ");
    foreach (const QString &part, parts)
    {
        i++;
        index += part.length();
        tokens.append(Token(Token::GenericTokenType, part, (index + i) - part.length() + 1));
    }

    return tokens;
}

void Parser::lexicalAnalysis(QList<Token> genericTokens)
{
    QListIterator<Token> it(genericTokens);
    while (it.hasNext())
    {
        Token token = it.next();
        QString string = token.toString();

        if (string.length() == 1)
        {
            QChar ch = string.at(0);
            if (isOperatorToken(ch))
            {
                d->tokens.append(Token(Token::OperatorTokenType, ch, token.index()));
                continue;
            }
        }

        if (string.toUpper() == "R$")
        {
            d->tokens.append(Token(Token::CurrencySignTokenType, string, token.index()));
            continue;
        } 

        QRegExp monthlyPaymentOperator("^(\\d+)[xX]$");
        if (string.contains(monthlyPaymentOperator))
        {
            d->tokens.append(Token(Token::OperatorTokenType, "x", token.index() + monthlyPaymentOperator.cap(1).length()));
            d->tokens.append(Token(Token::NumberTokenType, monthlyPaymentOperator.cap(1), token.index()));
            continue;
        }

        if (string.contains(QRegExp("^\\d+((.|,)?\\d+((.|,)?\\d+)?)?$")))
        {
            d->tokens.append(Token(Token::NumberTokenType, string, token.index()));
            continue;
        }

        d->tokens.append(Token(Token::StringTokenType, string, token.index()));
    }
}

bool Parser::isOperatorToken(const QChar &ch) const
{
    if (ch == '+') return true;
    else if (ch == '-') return true;
    else if (ch == 'x') return true;
    else if (ch == 'X') return true;
    else if (ch == '/') return true;

    return false;
}

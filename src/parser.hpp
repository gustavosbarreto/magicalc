#ifndef _PARSER_HPP
#define _PARSER_HPP

#include <QString>
#include <QSharedDataPointer>
#include <QList>

#include "token.hpp"

class ParserData: public QSharedData
{
public:
    QString expr;
    QList<Token> tokens;
};

class Parser
{
public:
    Parser(const QString &expr);
    Parser(const Parser &other);

    QList<Token> parse();

    Parser &operator=(const Parser &other);

private:
    QSharedDataPointer<ParserData> d;

    QList<Token> createGenericTokens();
    void lexicalAnalysis(QList<Token> genericTokens);

    bool isOperatorToken(const QChar &ch) const;
};

#endif

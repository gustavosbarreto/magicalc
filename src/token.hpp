#ifndef _TOKEN_HPP
#define _TOKEN_HPP

#include <QSharedData>
#include <QString>

class TokenData;

class Token
{
public:
    enum Type
    {
        GenericTokenType,
        OperatorTokenType,
        CurrencySignTokenType,
        NumberTokenType,
        StringTokenType
    };

    enum Operator
    {
        UnknownOperator,
        PlusOperator,
        MinusOperator,
        MultiplyOperator,
        DivideOperator
    };

    Token(Type type = GenericTokenType, const QString &data = "", int index = -1);

    Type type() const;
    int index() const;

    Operator toOperator() const;
    qreal toNumber() const;
    QString toString() const;

private:
    QSharedDataPointer<TokenData> d;
};

class TokenData: public QSharedData
{
public:
    Token::Type type;
    QString data;
    int index;
};

#endif

#include "token.hpp"

Token::Token(Type type, const QString &data, int index)
    : d(new TokenData)
{
    d->type = type;
    d->data = data;
    d->index = index;
}

Token::Type Token::type() const
{
    return d->type;
}

int Token::index() const
{
    return d->index;
}

Token::Operator Token::toOperator() const
{
    QChar ch = d->data.at(0);
    if (ch == '+') return PlusOperator;
    else if (ch == '-') return MinusOperator;
    else if (ch == 'x' || ch == 'X') return MultiplyOperator;
    else if (ch == '/') return DivideOperator;
    return UnknownOperator;
}

qreal Token::toNumber() const
{
    return d->data.toDouble();
}

QString Token::toString() const
{
    return d->data;
}

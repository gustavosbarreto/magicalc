QT += script

RESOURCES += resources.qrc

HEADERS += \
  mainwindow.hpp \
  parser.hpp \
  token.hpp \
  highlighter.hpp \
  engine.hpp \
  answercontroller.hpp

SOURCES += \
  mainwindow.cpp \
  main.cpp parser.cpp \
  token.cpp \
  highlighter.cpp \
  engine.cpp \
  answercontroller.cpp

FORMS += mainwindow.ui

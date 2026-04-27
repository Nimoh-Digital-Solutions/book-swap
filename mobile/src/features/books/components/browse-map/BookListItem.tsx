import React from "react";
import { View } from "react-native";

import { BookCard } from "../BookCard";
import { browseMapStyles as s } from "./styles";
import type { BrowseBook } from "../../hooks/useBooks";

interface BookListItemProps {
  book: BrowseBook;
  onPress: (bookId: string) => void;
}

export function BookListItem({ book, onPress }: BookListItemProps) {
  return (
    <View style={s.bookItemWrap}>
      <BookCard book={book} onPress={() => onPress(book.id)} />
    </View>
  );
}

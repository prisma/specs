import React from 'react'
import { Box, Color } from 'ink'
import figures from 'figures'
import stringWidth from 'string-width'

// Select Input
export const selectInputItemComponent = ({ isSelected, label }: any) => (
  <Color cyan={isSelected}>{label}</Color>
)

export const selectInputIndicatorComponent = ({ isSelected }: any) => (
  <Box marginRight={1}>
    {isSelected ? <Color cyan>{figures.pointer}</Color> : ' '}
  </Box>
)

// Multi Select
export const multiSelectItemComponent = ({ isHighlighted, label }: any) => (
  <Color cyan={isHighlighted}>{label}</Color>
)

export const multiSelectIndicatorComponent = ({ isHighlighted }: any) => (
  <Box marginRight={1}>
    {isHighlighted ? <Color cyan>{figures.pointer}</Color> : ' '}
  </Box>
)

export const multiSelectCheckboxComponent = ({ isSelected }: any) => (
  <Box marginRight={1}>
    <Color cyan>
      {isSelected ? figures.squareSmallFilled : figures.checkboxOff}
    </Color>
  </Box>
)

// Divider
export const Divider = ({
  title,
  width,
  padding,
  titlePadding,
  titleColor,
  dividerChar,
}: {
  title: string | null
  width: number
  padding: number
  titlePadding: number
  titleColor: string
  dividerChar: string
}) => {
  const getSideDividerWidth = (width: any, titleWidth: any) =>
    (width - titleWidth) / 2
  const getNumberOfCharsPerWidth = (char: any, width: any) =>
    width / stringWidth(char)
  const PAD = ' '
  const titleString = title
    ? `${PAD.repeat(titlePadding) + title + PAD.repeat(titlePadding)}`
    : ''
  const titleWidth = stringWidth(titleString)
  const dividerWidth = getSideDividerWidth(width, titleWidth)
  const numberOfCharsPerSide = getNumberOfCharsPerWidth(
    dividerChar,
    dividerWidth,
  )
  const dividerSideString = dividerChar.repeat(numberOfCharsPerSide)
  const paddingString = PAD.repeat(padding)

  return (
    <Box>
      {paddingString}
      <Color gray>{dividerSideString}</Color>
      <Color keyword={titleColor}>{titleString}</Color>
      <Color gray>{dividerSideString}</Color>
      {paddingString}
    </Box>
  )
}

Divider.defaultProps = {
  title: null,
  width: 60,
  padding: 0,
  titlePadding: 1,
  titleColor: 'white',
  dividerChar: '─',
}
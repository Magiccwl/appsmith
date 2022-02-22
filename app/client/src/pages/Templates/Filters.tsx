import React, { useEffect, useState, useMemo } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { Collapse } from "@blueprintjs/core";
import { Classes } from "components/ads/common";
import Text, { TextType } from "components/ads/Text";
import Icon, { IconSize } from "components/ads/Icon";
import { filterTemplates } from "actions/templateActions";
import { getWidgetCards } from "selectors/editorSelectors";
import { templatesDatasourceFiltersSelector } from "selectors/templatesSelectors";
import LeftPaneBottomSection from "pages/Home/LeftPaneBottomSection";
import { thinScrollbar } from "constants/DefaultTheme";
import { functions, useCases } from "./constants";

const FilterWrapper = styled.div`
  overflow: auto;
  height: calc(100vh - ${(props) => props.theme.homePage.header + 213}px);
  ${thinScrollbar}

  .more {
    padding-left: 10px;
    margin-top: 7px;
    cursor: pointer;
  }
`;

const Wrapper = styled.div`
  width: ${(props) => props.theme.homePage.sidebar}px;
  height: 100%;
  display: flex;
  padding-left: 16px;
  padding-top: 25px;
  flex-direction: column;
  box-shadow: 1px 0px 0px #ededed;
`;

const SecondWrapper = styled.div`
  height: calc(100vh - ${(props) => props.theme.homePage.header + 24}px);
  position: relative;
`;

const StyledFilterItem = styled.div<{ selected: boolean }>`
  cursor: pointer;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 7px 15px 7px 25px;
  .${Classes.TEXT} {
    color: #121826;
  }
  ${(props) =>
    props.selected &&
    `
    background-color: #ebebeb;
    .${Classes.TEXT} {
      color: #22223B;
    }
  `}

  .${Classes.ICON} {
    visibility: ${(props) => (props.selected ? "visible" : "hidden")};
  }

  &:hover {
    background-color: #ebebeb;
  }
`;

const StyledFilterCategory = styled(Text)`
  margin-bottom: 10px;
  padding-left: 15px;
`;

const ListWrapper = styled.div`
  margin-top: 10px;
`;

const FilterCategoryWrapper = styled.div`
  padding-bottom: 34px;
`;

type Filter = {
  label: string;
  value?: string;
};

interface FilterItemProps {
  item: Filter;
  onSelect: (item: string, action: string) => void;
}

interface FilterCategoryProps {
  label: string;
  filterList: Filter[];
}

const useGetFilterList = (): Record<string, Filter[]> => {
  const widgetConfigs = useSelector(getWidgetCards);
  const widgets = useMemo(() => {
    return widgetConfigs.map((widget) => {
      return {
        label: widget.displayName,
        value: widget.type,
      };
    });
  }, [widgetConfigs]);
  const datasources = useSelector(templatesDatasourceFiltersSelector);

  const filters = {
    functions,
    useCases,
    widgets,
    datasources,
  };

  return filters;
};

function FilterItem({ item, onSelect }: FilterItemProps) {
  const [selected, setSelected] = useState(false);

  const onClick = () => {
    const action = selected ? "remove" : "add";
    onSelect(item?.value ?? item.label, action);
    setSelected((selected) => !selected);
  };

  return (
    <StyledFilterItem onClick={onClick} selected={selected}>
      <Text color="#121826" type={TextType.P1}>
        {item.label}
      </Text>
      <Icon name={"close-x"} size={IconSize.XXXL} />
    </StyledFilterItem>
  );
}

function FilterCategory({ filterList, label }: FilterCategoryProps) {
  const [selectedItems, setSelectedItem] = useState<string[]>([]);
  const [expand, setExpand] = useState(false);
  const dispatch = useDispatch();
  const onSelect = (item: string, type: string) => {
    if (type === "add") {
      setSelectedItem((selectedItems) => [...selectedItems, item]);
    } else {
      setSelectedItem((selectedItems) =>
        selectedItems.filter((selectedItem) => selectedItem !== item),
      );
    }
    dispatch(filterTemplates(label, selectedItems));
  };

  useEffect(() => {
    dispatch(filterTemplates(label, selectedItems));
  }, [selectedItems]);

  const toggleExpand = () => {
    setExpand((expand) => !expand);
  };

  return (
    <FilterCategoryWrapper>
      <StyledFilterCategory type={TextType.SIDE_HEAD}>
        {label.toLocaleUpperCase()}
      </StyledFilterCategory>
      <ListWrapper>
        {filterList.slice(0, 3).map((filter) => {
          return (
            <FilterItem item={filter} key={filter.label} onSelect={onSelect} />
          );
        })}
        {!expand && (
          <Text
            className={"more"}
            onClick={toggleExpand}
            type={TextType.BUTTON_SMALL}
            underline
          >
            + {filterList.slice(3).length} MORE
          </Text>
        )}
        <Collapse isOpen={expand}>
          {filterList.slice(3).map((filter) => {
            return (
              <FilterItem
                item={filter}
                key={filter.label}
                onSelect={onSelect}
              />
            );
          })}
        </Collapse>
        {expand && !selectedItems.length && (
          <Text
            className={"more"}
            onClick={toggleExpand}
            type={TextType.BUTTON_SMALL}
            underline
          >
            - SHOW LESS
          </Text>
        )}
      </ListWrapper>
    </FilterCategoryWrapper>
  );
}

function Filters() {
  const filters = useGetFilterList();

  return (
    <Wrapper>
      <SecondWrapper>
        <FilterWrapper>
          {Object.keys(filters).map((filter) => {
            return (
              <FilterCategory
                filterList={filters[filter]}
                key={filter}
                label={filter}
              />
            );
          })}
        </FilterWrapper>
        <LeftPaneBottomSection />
      </SecondWrapper>
    </Wrapper>
  );
}

export default Filters;

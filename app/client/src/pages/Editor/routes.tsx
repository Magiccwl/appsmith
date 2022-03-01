import React, { useEffect, ReactNode } from "react";
import {
  Switch,
  withRouter,
  RouteComponentProps,
  Route,
  matchPath,
} from "react-router-dom";
import ApiEditor from "./APIEditor";
import IntegrationEditor from "./IntegrationEditor";
import QueryEditor from "./QueryEditor";
import DataSourceEditor from "./DataSourceEditor";
import JSEditor from "./JSEditor";

import GeneratePage from "./GeneratePage";
import CurlImportForm from "./APIEditor/CurlImportForm";
import ProviderTemplates from "./APIEditor/ProviderTemplates";
import {
  BuilderRouteParams,
  INTEGRATION_EDITOR_PATH,
  API_EDITOR_ID_PATH,
  QUERIES_EDITOR_ID_PATH,
  JS_COLLECTION_EDITOR_PATH,
  JS_COLLECTION_ID_PATH,
  CURL_IMPORT_PAGE_PATH,
  PAGE_LIST_EDITOR_PATH,
  DATA_SOURCES_EDITOR_ID_PATH,
  PROVIDER_TEMPLATE_PATH,
  GENERATE_TEMPLATE_PATH,
  GENERATE_TEMPLATE_FORM_PATH,
  matchBuilderPath,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
} from "constants/routes";
import styled from "styled-components";
import { useShowPropertyPane } from "utils/hooks/dragResizeHooks";
import { closeAllModals } from "actions/widgetActions";
import { connect, useDispatch } from "react-redux";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";

import * as Sentry from "@sentry/react";
const SentryRoute = Sentry.withSentryRouting(Route);

import { SaaSEditorRoutes } from "./SaaSEditor/routes";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import PagesEditor from "./PagesEditor";

import { AppState } from "reducers";

import { trimQueryString } from "utils/helpers";
import {
  getCurrentApplicationId,
  selectURLSlugs,
} from "selectors/editorSelectors";
import { builderURL } from "AppsmithRouteFactory";

const Wrapper = styled.div<{ isVisible: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: ${(props) => (!props.isVisible ? "0px" : "100%")};
  height: 100%;
  background-color: ${(props) =>
    props.isVisible ? "rgba(0, 0, 0, 0.26)" : "transparent"};
  z-index: ${(props) => (props.isVisible ? 2 : -1)};
`;

const DrawerWrapper = styled.div<{
  isVisible: boolean;
  isActionPath: any;
}>`
  background-color: white;
  width: ${(props) => (!props.isVisible ? "0" : "100%")};
  height: 100%;
  display: flex;
  flex-direction: column;
`;

interface RouterState {
  isVisible: boolean;
  isActionPath: Record<any, any> | null;
  path: string;
}

type Props = RouteComponentProps<BuilderRouteParams> & {
  applicationId: string;
  applicationSlug: string;
  pageSlug: string;
};

function isANestedPath(path: string) {
  return matchPath(path, {
    path: [BUILDER_PATH, BUILDER_PATH_DEPRECATED],
    strict: false,
    exact: false,
  });
}

class EditorsRouter extends React.Component<Props, RouterState> {
  constructor(props: Props) {
    super(props);
    const isOnBuilder = matchBuilderPath(window.location.pathname);
    const match = isANestedPath(window.location.pathname);
    this.state = {
      isVisible: !isOnBuilder,
      isActionPath: this.isMatchPath(),
      path: match?.path || "",
    };
  }

  componentDidUpdate(prevProps: Readonly<RouteComponentProps>): void {
    if (this.props.location.pathname !== prevProps.location.pathname) {
      const isOnBuilder = matchBuilderPath(window.location.pathname);
      const match = isANestedPath(window.location.pathname);
      this.setState({
        isVisible: !isOnBuilder,
        isActionPath: this.isMatchPath(),
        path: match?.path || "",
      });
    }
  }

  isMatchPath = () => {
    return matchPath(this.props.location.pathname, {
      path: [
        trimQueryString(INTEGRATION_EDITOR_PATH),
        trimQueryString(API_EDITOR_ID_PATH),
        trimQueryString(QUERIES_EDITOR_ID_PATH),
      ],
      exact: true,
      strict: false,
    });
  };

  handleClose = (e: React.MouseEvent) => {
    PerformanceTracker.startTracking(
      PerformanceTransactionName.CLOSE_SIDE_PANE,
      { path: this.props.location.pathname },
    );
    e.stopPropagation();
    this.setState({
      isVisible: false,
    });
    this.props.history.replace(builderURL());
  };

  preventClose = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  render(): React.ReactNode {
    return (
      <Wrapper isVisible={this.state.isVisible} onClick={this.handleClose}>
        <PaneDrawer
          isActionPath={this.state.isActionPath}
          isVisible={this.state.isVisible}
          onClick={this.preventClose}
        >
          <Switch key={this.state.path}>
            <SentryRoute
              component={IntegrationEditor}
              exact
              path={`${this.state.path}${INTEGRATION_EDITOR_PATH}`}
            />
            <SentryRoute
              component={ApiEditor}
              exact
              path={`${this.state.path}${API_EDITOR_ID_PATH}`}
            />
            <SentryRoute
              component={QueryEditor}
              exact
              path={`${this.state.path}${QUERIES_EDITOR_ID_PATH}`}
            />
            <SentryRoute
              component={JSEditor}
              exact
              path={`${this.state.path}${JS_COLLECTION_EDITOR_PATH}`}
            />
            <SentryRoute
              component={JSEditor}
              exact
              path={`${this.state.path}${JS_COLLECTION_ID_PATH}`}
            />

            <SentryRoute
              component={CurlImportForm}
              exact
              path={`${this.state.path}${CURL_IMPORT_PAGE_PATH}`}
            />
            {SaaSEditorRoutes.map(({ component, path }) => (
              <SentryRoute
                component={component}
                exact
                key={path}
                path={`${this.state.path}${path}`}
              />
            ))}
            <SentryRoute
              component={PagesEditor}
              exact
              path={`${this.state.path}${PAGE_LIST_EDITOR_PATH}`}
            />
            <SentryRoute
              component={DataSourceEditor}
              exact
              path={`${this.state.path}${DATA_SOURCES_EDITOR_ID_PATH}`}
            />
            <SentryRoute
              component={ProviderTemplates}
              exact
              path={`${this.state.path}${PROVIDER_TEMPLATE_PATH}`}
            />
            <SentryRoute
              component={GeneratePage}
              exact
              path={`${this.state.path}${GENERATE_TEMPLATE_PATH}`}
            />
            <SentryRoute
              component={GeneratePage}
              exact
              path={`${this.state.path}${GENERATE_TEMPLATE_FORM_PATH}`}
            />
          </Switch>
        </PaneDrawer>
      </Wrapper>
    );
  }
}
type PaneDrawerProps = {
  isVisible: boolean;
  isActionPath: Record<any, any> | null;
  onClick: (e: React.MouseEvent) => void;
  children: ReactNode;
};
function PaneDrawer(props: PaneDrawerProps) {
  const showPropertyPane = useShowPropertyPane();
  const { focusWidget, selectWidget } = useWidgetSelection();
  const dispatch = useDispatch();
  useEffect(() => {
    // This pane drawer is only open when NOT on canvas.
    // De-select all widgets
    // Un-focus all widgets
    // Hide property pane
    // Close all modals
    if (props.isVisible) {
      showPropertyPane();
      selectWidget(undefined);
      focusWidget(undefined);
      dispatch(closeAllModals());
    }
  }, [dispatch, props.isVisible, selectWidget, showPropertyPane, focusWidget]);
  return <DrawerWrapper {...props}>{props.children}</DrawerWrapper>;
}

PaneDrawer.displayName = "PaneDrawer";

const mapStateToProps = (state: AppState) => {
  const { applicationSlug, pageSlug } = selectURLSlugs(state);
  return {
    applicationId: getCurrentApplicationId(state),
    applicationSlug,
    pageSlug,
  };
};

export default connect(mapStateToProps)(withRouter(EditorsRouter));

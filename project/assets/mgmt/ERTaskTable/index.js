import { splitStartupRedux } from 'utils/WebpackSplit';

const startup = function(element){
    import('mgmt/ERTaskTable/containers/Root').then((Component) => {
        import('mgmt/ERTaskTable/store/configureStore').then((store) => {
            splitStartupRedux(element, Component.default, store.default);
        });
    });
};

export default startup;

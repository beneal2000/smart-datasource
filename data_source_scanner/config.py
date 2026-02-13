"""
数据源配置文件
整理国内外主要数据源信息
"""
from .models import DataSource, DataSourceType, DataType

DATA_SOURCES: list[DataSource] = [
    # ==================== 中国免费数据源 ====================
    DataSource(
        name="AKShare",
        package_name="akshare",
        source_type=DataSourceType.CHINA_FREE,
        data_types=[
            DataType.STOCK, DataType.FUND, DataType.BOND, DataType.FUTURES,
            DataType.OPTIONS, DataType.MACRO, DataType.FINANCIAL, DataType.NEWS,
            DataType.INDEX, DataType.ETF, DataType.CRYPTO
        ],
        description="AKShare是开源的金融数据接口库，提供股票、期货、期权、基金、债券、外汇等金融数据",
        website="https://akshare.akfamily.xyz/",
        is_free=True,
        rate_limit="建议控制请求频率，避免被封IP",
        registration_required=False,
        api_key_required=False,
        install_command="pip install akshare",
        pros=[
            "完全免费开源",
            "数据种类丰富，覆盖面广",
            "无需注册和API Key",
            "文档完善，社区活跃",
            "支持期货行情数据",
            "更新频繁"
        ],
        cons=[
            "请求频率限制",
            "部分数据不稳定",
            "无官方技术支持"
        ],
        priority_score=95
    ),
    DataSource(
        name="Tushare",
        package_name="tushare",
        source_type=DataSourceType.CHINA_FREE,
        data_types=[
            DataType.STOCK, DataType.FUND, DataType.BOND, DataType.FUTURES,
            DataType.OPTIONS, DataType.MACRO, DataType.FINANCIAL, DataType.INDEX,
            DataType.ETF
        ],
        description="Tushare是知名的免费金融数据接口，提供股票、基金、期货等金融数据",
        website="https://tushare.pro/",
        is_free=True,
        price_info="基础版免费，高级数据需要积分",
        rate_limit="根据积分等级不同",
        registration_required=True,
        api_key_required=True,
        install_command="pip install tushare",
        pros=[
            "数据质量高",
            "历史数据完整",
            "数据更新及时",
            "支持多种金融产品"
        ],
        cons=[
            "需要注册获取Token",
            "高级数据需要积分",
            "部分接口收费"
        ],
        priority_score=90
    ),
    DataSource(
        name="Baostock",
        package_name="baostock",
        source_type=DataSourceType.CHINA_FREE,
        data_types=[
            DataType.STOCK, DataType.FUND, DataType.BOND, DataType.INDEX,
            DataType.MACRO, DataType.FINANCIAL
        ],
        description="Baostock是证券宝提供的免费数据接口，提供股票、基金、债券等历史数据",
        website="http://baostock.com/",
        is_free=True,
        rate_limit="无明确限制",
        registration_required=False,
        api_key_required=False,
        install_command="pip install baostock",
        pros=[
            "完全免费",
            "历史数据丰富",
            "无需注册",
            "数据稳定"
        ],
        cons=[
            "数据种类相对较少",
            "实时性较差",
            "更新不如其他平台频繁"
        ],
        priority_score=85
    ),
    DataSource(
        name="EFinance",
        package_name="efinance",
        source_type=DataSourceType.CHINA_FREE,
        data_types=[
            DataType.STOCK, DataType.FUND, DataType.BOND, DataType.FUTURES,
            DataType.OPTIONS, DataType.INDEX, DataType.ETF
        ],
        description="EFinance是东方财富的数据接口，提供股票、基金、期货等实时行情数据",
        website="https://github.com/Micro-sheep/efinance",
        is_free=True,
        rate_limit="建议控制请求频率",
        registration_required=False,
        api_key_required=False,
        install_command="pip install efinance",
        pros=[
            "实时行情数据",
            "无需注册",
            "数据来源东方财富",
            "支持期货期权"
        ],
        cons=[
            "非官方接口",
            "稳定性依赖第三方"
        ],
        priority_score=80
    ),
    DataSource(
        name="Qlib",
        package_name="pyqlib",
        source_type=DataSourceType.CHINA_FREE,
        data_types=[
            DataType.STOCK, DataType.FINANCIAL, DataType.INDEX
        ],
        description="微软开源的AI量化投资平台，内置数据获取功能",
        website="https://github.com/microsoft/qlib",
        is_free=True,
        registration_required=False,
        api_key_required=False,
        install_command="pip install pyqlib",
        pros=[
            "微软开源项目",
            "内置机器学习框架",
            "数据质量高"
        ],
        cons=[
            "学习曲线陡峭",
            "数据种类有限"
        ],
        priority_score=75
    ),
    
    # ==================== 中国付费数据源 ====================
    DataSource(
        name="Wind万得",
        package_name="WindPy",
        source_type=DataSourceType.CHINA_PAID,
        data_types=[
            DataType.STOCK, DataType.FUND, DataType.BOND, DataType.FUTURES,
            DataType.OPTIONS, DataType.FOREX, DataType.MACRO, DataType.FINANCIAL,
            DataType.NEWS, DataType.INDEX, DataType.ETF
        ],
        description="中国金融数据行业领导者，提供最全面的金融数据服务",
        website="https://www.wind.com.cn/",
        is_free=False,
        price_info="年费数万至数十万不等",
        registration_required=True,
        api_key_required=True,
        pros=[
            "数据最全面权威",
            "更新及时",
            "技术支持完善",
            "机构级数据质量"
        ],
        cons=[
            "价格昂贵",
            "个人用户难以承受"
        ],
        priority_score=70
    ),
    DataSource(
        name="东方财富Choice",
        package_name="choicelib",
        source_type=DataSourceType.CHINA_PAID,
        data_types=[
            DataType.STOCK, DataType.FUND, DataType.BOND, DataType.FUTURES,
            DataType.OPTIONS, DataType.MACRO, DataType.FINANCIAL, DataType.INDEX
        ],
        description="东方财富旗下专业金融数据服务",
        website="https://choice.eastmoney.com/",
        is_free=False,
        price_info="年费数千至数万",
        registration_required=True,
        api_key_required=True,
        pros=[
            "数据全面",
            "价格相对Wind较低",
            "界面友好"
        ],
        cons=[
            "仍需付费",
            "部分数据不如Wind"
        ],
        priority_score=65
    ),
    DataSource(
        name="同花顺iFinD",
        package_name="iFinD",
        source_type=DataSourceType.CHINA_PAID,
        data_types=[
            DataType.STOCK, DataType.FUND, DataType.BOND, DataType.FUTURES,
            DataType.OPTIONS, DataType.MACRO, DataType.FINANCIAL, DataType.NEWS
        ],
        description="同花顺旗下金融数据终端",
        website="https://www.10jqka.com.cn/",
        is_free=False,
        price_info="年费数千至数万",
        registration_required=True,
        api_key_required=True,
        pros=[
            "数据丰富",
            "分析工具完善"
        ],
        cons=[
            "需要付费",
            "API接口不如Wind"
        ],
        priority_score=60
    ),
    
    # ==================== 国际免费数据源 ====================
    DataSource(
        name="Yahoo Finance",
        package_name="yfinance",
        source_type=DataSourceType.INTERNATIONAL_FREE,
        data_types=[
            DataType.STOCK, DataType.ETF, DataType.FUND, DataType.INDEX,
            DataType.CRYPTO, DataType.FOREX
        ],
        description="雅虎财经数据接口，提供全球股票、ETF、加密货币等数据",
        website="https://finance.yahoo.com/",
        is_free=True,
        rate_limit="建议控制请求频率",
        registration_required=False,
        api_key_required=False,
        install_command="pip install yfinance",
        pros=[
            "完全免费",
            "全球市场覆盖",
            "无需注册",
            "历史数据丰富"
        ],
        cons=[
            "非官方API",
            "可能被限流",
            "实时性一般"
        ],
        priority_score=90
    ),
    DataSource(
        name="Alpha Vantage",
        package_name="alpha_vantage",
        source_type=DataSourceType.INTERNATIONAL_FREE,
        data_types=[
            DataType.STOCK, DataType.FOREX, DataType.CRYPTO, DataType.INDEX,
            DataType.FINANCIAL
        ],
        description="提供股票、外汇、加密货币等金融数据的免费API",
        website="https://www.alphavantage.co/",
        is_free=True,
        price_info="免费版有请求限制，付费版无限制",
        rate_limit="免费版5次/分钟，500次/天",
        registration_required=True,
        api_key_required=True,
        install_command="pip install alpha_vantage",
        pros=[
            "免费额度充足",
            "数据质量好",
            "技术指标丰富"
        ],
        cons=[
            "需要API Key",
            "请求频率限制"
        ],
        priority_score=85
    ),
    DataSource(
        name="IEX Cloud",
        package_name="iexfinance",
        source_type=DataSourceType.INTERNATIONAL_FREE,
        data_types=[
            DataType.STOCK, DataType.ETF, DataType.FUND, DataType.MACRO,
            DataType.NEWS
        ],
        description="美国股票数据平台，提供实时和历史股票数据",
        website="https://iexcloud.io/",
        is_free=True,
        price_info="免费版有月度消息限制",
        rate_limit="根据套餐不同",
        registration_required=True,
        api_key_required=True,
        install_command="pip install iexfinance",
        pros=[
            "美股数据权威",
            "API设计优秀",
            "有免费额度"
        ],
        cons=[
            "免费额度有限",
            "主要覆盖美股"
        ],
        priority_score=80
    ),
    DataSource(
        name="Quandl",
        package_name="quandl",
        source_type=DataSourceType.INTERNATIONAL_FREE,
        data_types=[
            DataType.STOCK, DataType.FUTURES, DataType.MACRO, DataType.FINANCIAL,
            DataType.ALTERNATIVE
        ],
        description="Nasdaq旗下数据平台，提供金融、经济、另类数据",
        website="https://www.quandl.com/",
        is_free=True,
        price_info="部分数据免费，高级数据付费",
        registration_required=True,
        api_key_required=True,
        install_command="pip install quandl",
        pros=[
            "数据种类丰富",
            "另类数据独特",
            "数据质量高"
        ],
        cons=[
            "免费数据减少",
            "需要API Key"
        ],
        priority_score=75
    ),
    DataSource(
        name="FRED",
        package_name="fredapi",
        source_type=DataSourceType.INTERNATIONAL_FREE,
        data_types=[DataType.MACRO],
        description="美联储经济数据，提供美国及全球经济指标",
        website="https://fred.stlouisfed.org/",
        is_free=True,
        rate_limit="无明确限制",
        registration_required=True,
        api_key_required=True,
        install_command="pip install fredapi",
        pros=[
            "权威宏观经济数据",
            "完全免费",
            "数据更新及时"
        ],
        cons=[
            "仅限宏观经济数据",
            "需要API Key"
        ],
        priority_score=95
    ),
    DataSource(
        name="World Bank",
        package_name="pandas_datareader",
        source_type=DataSourceType.INTERNATIONAL_FREE,
        data_types=[DataType.MACRO],
        description="世界银行开放数据，提供全球发展指标",
        website="https://data.worldbank.org/",
        is_free=True,
        registration_required=False,
        api_key_required=False,
        install_command="pip install pandas_datareader",
        pros=[
            "全球宏观数据",
            "完全免费",
            "无需注册"
        ],
        cons=[
            "数据更新较慢",
            "仅限宏观数据"
        ],
        priority_score=80
    ),
    DataSource(
        name="Fama/French",
        package_name="pandas_datareader",
        source_type=DataSourceType.INTERNATIONAL_FREE,
        data_types=[DataType.MACRO, DataType.FINANCIAL],
        description="Fama-French研究数据，因子投资经典数据源",
        website="https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/data_library.html",
        is_free=True,
        registration_required=False,
        api_key_required=False,
        install_command="pip install pandas_datareader",
        pros=[
            "因子投资必备",
            "学术权威",
            "完全免费"
        ],
        cons=[
            "数据种类单一",
            "更新频率较低"
        ],
        priority_score=85
    ),
    DataSource(
        name="CoinGecko",
        package_name="pycoingecko",
        source_type=DataSourceType.INTERNATIONAL_FREE,
        data_types=[DataType.CRYPTO],
        description="加密货币数据平台，提供全面的加密货币市场数据",
        website="https://www.coingecko.com/",
        is_free=True,
        rate_limit="免费版10-50次/分钟",
        registration_required=False,
        api_key_required=False,
        install_command="pip install pycoingecko",
        pros=[
            "加密货币数据全面",
            "免费使用",
            "无需注册"
        ],
        cons=[
            "仅限加密货币",
            "请求频率限制"
        ],
        priority_score=90
    ),
    DataSource(
        name="CoinMarketCap",
        package_name="python_coinmarketcap",
        source_type=DataSourceType.INTERNATIONAL_FREE,
        data_types=[DataType.CRYPTO],
        description="知名加密货币数据平台",
        website="https://coinmarketcap.com/",
        is_free=True,
        rate_limit="免费版有限制",
        registration_required=True,
        api_key_required=True,
        install_command="pip install python-coinmarketcap",
        pros=[
            "加密货币数据权威",
            "市场认可度高"
        ],
        cons=[
            "需要API Key",
            "免费版限制多"
        ],
        priority_score=85
    ),
    
    # ==================== 国际付费数据源 ====================
    DataSource(
        name="Bloomberg",
        package_name="blpapi",
        source_type=DataSourceType.INTERNATIONAL_PAID,
        data_types=[
            DataType.STOCK, DataType.FUND, DataType.BOND, DataType.FUTURES,
            DataType.OPTIONS, DataType.FOREX, DataType.MACRO, DataType.FINANCIAL,
            DataType.NEWS, DataType.INDEX, DataType.ETF
        ],
        description="全球金融数据行业领导者",
        website="https://www.bloomberg.com/professional/",
        is_free=False,
        price_info="年费约2.4万美元起",
        registration_required=True,
        api_key_required=True,
        pros=[
            "全球最权威",
            "数据最全面",
            "实时性最强"
        ],
        cons=[
            "价格极其昂贵",
            "仅限机构用户"
        ],
        priority_score=50
    ),
    DataSource(
        name="Refinitiv",
        package_name="eikon",
        source_type=DataSourceType.INTERNATIONAL_PAID,
        data_types=[
            DataType.STOCK, DataType.FUND, DataType.BOND, DataType.FUTURES,
            DataType.OPTIONS, DataType.FOREX, DataType.MACRO, DataType.FINANCIAL,
            DataType.NEWS
        ],
        description="路透社旗下金融数据平台",
        website="https://www.refinitiv.com/",
        is_free=False,
        price_info="年费数千至数万美元",
        registration_required=True,
        api_key_required=True,
        pros=[
            "数据权威",
            "全球覆盖",
            "新闻资讯丰富"
        ],
        cons=[
            "价格昂贵",
            "需要订阅"
        ],
        priority_score=55
    ),
    DataSource(
        name="Polygon.io",
        package_name="polygon-api-client",
        source_type=DataSourceType.INTERNATIONAL_PAID,
        data_types=[
            DataType.STOCK, DataType.OPTIONS, DataType.FOREX, DataType.CRYPTO
        ],
        description="现代金融数据API平台，提供实时和历史数据",
        website="https://polygon.io/",
        is_free=True,
        price_info="免费版有限制，付费版$199-999/月",
        rate_limit="根据套餐不同",
        registration_required=True,
        api_key_required=True,
        install_command="pip install polygon-api-client",
        pros=[
            "API设计现代",
            "实时数据好",
            "有免费额度"
        ],
        cons=[
            "高级功能付费",
            "主要覆盖美股"
        ],
        priority_score=70
    ),
    DataSource(
        name="Morningstar",
        package_name="morningstar",
        source_type=DataSourceType.INTERNATIONAL_PAID,
        data_types=[DataType.FUND, DataType.STOCK, DataType.FINANCIAL],
        description="晨星基金评级和数据服务",
        website="https://www.morningstar.com/",
        is_free=False,
        price_info="部分免费，高级数据付费",
        registration_required=True,
        api_key_required=True,
        pros=[
            "基金数据权威",
            "评级体系完善"
        ],
        cons=[
            "API访问受限",
            "部分数据付费"
        ],
        priority_score=65
    ),
    
    # ==================== 更多中国免费数据源 ====================
    DataSource(
        name="TuShare老版本",
        package_name="tushare",
        source_type=DataSourceType.CHINA_FREE,
        data_types=[DataType.STOCK, DataType.INDEX, DataType.FUND],
        description="Tushare老版本接口，部分功能仍可免费使用",
        website="https://tushare.readthedocs.io/",
        is_free=True,
        registration_required=False,
        api_key_required=False,
        install_command="pip install tushare",
        pros=[
            "无需注册",
            "基础数据可用",
            "稳定可靠"
        ],
        cons=[
            "数据较少",
            "不再维护"
        ],
        priority_score=70
    ),
    DataSource(
        name="JQData聚宽",
        package_name="jqdatasdk",
        source_type=DataSourceType.CHINA_FREE,
        data_types=[DataType.STOCK, DataType.FUND, DataType.INDEX, DataType.FINANCIAL],
        description="聚宽量化平台数据接口，提供股票、基金等数据",
        website="https://www.joinquant.com/",
        is_free=True,
        price_info="免费版每日100万条数据",
        registration_required=True,
        api_key_required=True,
        install_command="pip install jqdatasdk",
        pros=[
            "数据质量高",
            "适合量化研究",
            "有免费额度"
        ],
        cons=[
            "需要注册",
            "免费额度有限"
        ],
        priority_score=82
    ),
    DataSource(
        name="RQData米筐",
        package_name="rqdatac",
        source_type=DataSourceType.CHINA_FREE,
        data_types=[DataType.STOCK, DataType.FUND, DataType.INDEX, DataType.FUTURES],
        description="米筐科技数据接口，提供股票、期货等数据",
        website="https://www.ricequant.com/",
        is_free=True,
        price_info="免费版有限制",
        registration_required=True,
        api_key_required=True,
        install_command="pip install rqdatac",
        pros=[
            "数据质量好",
            "支持期货",
            "量化平台集成"
        ],
        cons=[
            "需要注册",
            "免费版限制"
        ],
        priority_score=78
    ),
    DataSource(
        name="EasyQuotation",
        package_name="easyquotation",
        source_type=DataSourceType.CHINA_FREE,
        data_types=[DataType.STOCK, DataType.INDEX],
        description="实时股票行情数据接口，支持新浪、腾讯等数据源",
        website="https://github.com/shidenggui/easyquotation",
        is_free=True,
        registration_required=False,
        api_key_required=False,
        install_command="pip install easyquotation",
        pros=[
            "完全免费",
            "实时行情",
            "无需注册"
        ],
        cons=[
            "仅限行情",
            "非官方接口"
        ],
        priority_score=72
    ),
    DataSource(
        name="ZVT",
        package_name="zvt",
        source_type=DataSourceType.CHINA_FREE,
        data_types=[DataType.STOCK, DataType.FUND, DataType.INDEX, DataType.FINANCIAL],
        description="开源的量化交易框架，内置数据获取功能",
        website="https://github.com/zvtvz/zvt",
        is_free=True,
        registration_required=False,
        api_key_required=False,
        install_command="pip install zvt",
        pros=[
            "完全免费开源",
            "数据持久化",
            "量化框架集成"
        ],
        cons=[
            "学习曲线陡峭",
            "文档较少"
        ],
        priority_score=70
    ),
    DataSource(
        name="Ashare",
        package_name="ashare",
        source_type=DataSourceType.CHINA_FREE,
        data_types=[DataType.STOCK, DataType.INDEX],
        description="轻量级A股数据接口",
        website="https://github.com/mpquant/ashare",
        is_free=True,
        registration_required=False,
        api_key_required=False,
        install_command="pip install ashare",
        pros=[
            "轻量简单",
            "完全免费",
            "无需注册"
        ],
        cons=[
            "数据种类少",
            "功能有限"
        ],
        priority_score=68
    ),
    DataSource(
        name="Mootdx",
        package_name="mootdx",
        source_type=DataSourceType.CHINA_FREE,
        data_types=[DataType.STOCK, DataType.INDEX],
        description="通达信数据接口，提供实时行情数据",
        website="https://github.com/mootdx/mootdx",
        is_free=True,
        registration_required=False,
        api_key_required=False,
        install_command="pip install mootdx",
        pros=[
            "通达信数据源",
            "实时性好",
            "完全免费"
        ],
        cons=[
            "需要通达信",
            "配置复杂"
        ],
        priority_score=65
    ),
    
    # ==================== 更多国际免费数据源 ====================
    DataSource(
        name="Pandas DataReader",
        package_name="pandas_datareader",
        source_type=DataSourceType.INTERNATIONAL_FREE,
        data_types=[DataType.STOCK, DataType.MACRO, DataType.INDEX],
        description="Pandas数据读取库，支持多种数据源",
        website="https://pandas-datareader.readthedocs.io/",
        is_free=True,
        registration_required=False,
        api_key_required=False,
        install_command="pip install pandas_datareader",
        pros=[
            "统一接口",
            "支持多数据源",
            "Pandas集成"
        ],
        cons=[
            "部分源不稳定",
            "功能分散"
        ],
        priority_score=80
    ),
    DataSource(
        name="Investpy",
        package_name="investpy",
        source_type=DataSourceType.INTERNATIONAL_FREE,
        data_types=[DataType.STOCK, DataType.FUND, DataType.INDEX, DataType.BOND],
        description="Investing.com数据接口，提供全球金融数据",
        website="https://github.com/alvarobartt/investpy",
        is_free=True,
        registration_required=False,
        api_key_required=False,
        install_command="pip install investpy",
        pros=[
            "全球市场覆盖",
            "数据种类多",
            "无需注册"
        ],
        cons=[
            "可能被限流",
            "非官方接口"
        ],
        priority_score=75
    ),
    DataSource(
        name="yahoofinancials",
        package_name="yahoofinancials",
        source_type=DataSourceType.INTERNATIONAL_FREE,
        data_types=[DataType.STOCK, DataType.INDEX, DataType.CRYPTO],
        description="Yahoo Finance数据接口，功能比yfinance更丰富",
        website="https://github.com/JECSand/yahoofinancials",
        is_free=True,
        registration_required=False,
        api_key_required=False,
        install_command="pip install yahoofinancials",
        pros=[
            "功能丰富",
            "财务数据完整",
            "免费使用"
        ],
        cons=[
            "非官方接口",
            "可能被限流"
        ],
        priority_score=78
    ),
    DataSource(
        name="Tiingo",
        package_name="tiingo",
        source_type=DataSourceType.INTERNATIONAL_FREE,
        data_types=[DataType.STOCK, DataType.FUND, DataType.CRYPTO, DataType.NEWS],
        description="金融数据平台，提供股票、加密货币和新闻数据",
        website="https://tiingo.com/",
        is_free=True,
        price_info="免费版有限制",
        registration_required=True,
        api_key_required=True,
        install_command="pip install tiingo",
        pros=[
            "数据质量高",
            "新闻数据",
            "有免费额度"
        ],
        cons=[
            "需要API Key",
            "免费版限制"
        ],
        priority_score=77
    ),
    DataSource(
        name="Finnhub",
        package_name="finnhub-python",
        source_type=DataSourceType.INTERNATIONAL_FREE,
        data_types=[DataType.STOCK, DataType.FOREX, DataType.CRYPTO, DataType.NEWS],
        description="免费金融数据API，提供股票、外汇、加密货币数据",
        website="https://finnhub.io/",
        is_free=True,
        price_info="免费版60次/分钟",
        rate_limit="免费版60次/分钟",
        registration_required=True,
        api_key_required=True,
        install_command="pip install finnhub-python",
        pros=[
            "免费额度充足",
            "数据质量好",
            "新闻数据"
        ],
        cons=[
            "需要API Key",
            "部分功能付费"
        ],
        priority_score=82
    ),
    DataSource(
        name="MarketStack",
        package_name="marketstack",
        source_type=DataSourceType.INTERNATIONAL_FREE,
        data_types=[DataType.STOCK, DataType.INDEX],
        description="股票市场数据API，支持全球70+交易所",
        website="https://marketstack.com/",
        is_free=True,
        price_info="免费版每月100次请求",
        rate_limit="免费版每月100次",
        registration_required=True,
        api_key_required=True,
        install_command="pip install marketstack",
        pros=[
            "全球交易所",
            "有免费额度",
            "数据质量好"
        ],
        cons=[
            "免费额度少",
            "需要API Key"
        ],
        priority_score=70
    ),
    DataSource(
        name="Twelve Data",
        package_name="twelvedata",
        source_type=DataSourceType.INTERNATIONAL_FREE,
        data_types=[DataType.STOCK, DataType.FOREX, DataType.INDEX, DataType.CRYPTO],
        description="金融数据API，提供股票、外汇、加密货币数据",
        website="https://twelvedata.com/",
        is_free=True,
        price_info="免费版800次/天",
        rate_limit="免费版800次/天",
        registration_required=True,
        api_key_required=True,
        install_command="pip install twelvedata",
        pros=[
            "免费额度充足",
            "技术指标丰富",
            "API友好"
        ],
        cons=[
            "需要API Key",
            "高级功能付费"
        ],
        priority_score=83
    ),
    DataSource(
        name="EODHD",
        package_name="eodhd",
        source_type=DataSourceType.INTERNATIONAL_FREE,
        data_types=[DataType.STOCK, DataType.FUND, DataType.INDEX, DataType.FOREX],
        description="EOD Historical Data，提供全球股票历史数据",
        website="https://eodhd.com/",
        is_free=True,
        price_info="免费版每日20次请求",
        rate_limit="免费版每日20次",
        registration_required=True,
        api_key_required=True,
        install_command="pip install eodhd",
        pros=[
            "历史数据丰富",
            "全球市场",
            "有免费额度"
        ],
        cons=[
            "免费额度少",
            "需要API Key"
        ],
        priority_score=68
    ),
    DataSource(
        name="CCXT",
        package_name="ccxt",
        source_type=DataSourceType.INTERNATIONAL_FREE,
        data_types=[DataType.CRYPTO],
        description="加密货币交易所统一接口，支持100+交易所",
        website="https://github.com/ccxt/ccxt",
        is_free=True,
        registration_required=False,
        api_key_required=False,
        install_command="pip install ccxt",
        pros=[
            "支持交易所最多",
            "统一API",
            "完全免费"
        ],
        cons=[
            "仅限加密货币",
            "配置复杂"
        ],
        priority_score=92
    ),
    DataSource(
        name="Cryptocompare",
        package_name="cryptocompare",
        source_type=DataSourceType.INTERNATIONAL_FREE,
        data_types=[DataType.CRYPTO],
        description="加密货币数据聚合平台",
        website="https://www.cryptocompare.com/",
        is_free=True,
        rate_limit="免费版100,000次/月",
        registration_required=True,
        api_key_required=True,
        install_command="pip install cryptocompare",
        pros=[
            "数据全面",
            "历史数据丰富",
            "免费额度充足"
        ],
        cons=[
            "需要API Key",
            "仅限加密货币"
        ],
        priority_score=85
    ),
    DataSource(
        name="Historical Data",
        package_name="yfinance",
        source_type=DataSourceType.INTERNATIONAL_FREE,
        data_types=[DataType.STOCK, DataType.INDEX],
        description="通过yfinance获取历史数据",
        website="https://finance.yahoo.com/",
        is_free=True,
        registration_required=False,
        api_key_required=False,
        install_command="pip install yfinance",
        pros=[
            "历史数据丰富",
            "免费使用",
            "无需注册"
        ],
        cons=[
            "实时性差",
            "非官方接口"
        ],
        priority_score=80
    ),
    DataSource(
        name="SEC EDGAR",
        package_name="sec-edgar-downloader",
        source_type=DataSourceType.INTERNATIONAL_FREE,
        data_types=[DataType.FINANCIAL, DataType.STOCK],
        description="美国SEC官方财务报表数据",
        website="https://www.sec.gov/edgar",
        is_free=True,
        registration_required=False,
        api_key_required=False,
        install_command="pip install sec-edgar-downloader",
        pros=[
            "官方权威数据",
            "完全免费",
            "财务报表完整"
        ],
        cons=[
            "仅限美股",
            "数据解析复杂"
        ],
        priority_score=88
    ),
    DataSource(
        name="SimFin",
        package_name="simfin",
        source_type=DataSourceType.INTERNATIONAL_FREE,
        data_types=[DataType.STOCK, DataType.FINANCIAL],
        description="免费财务数据平台，提供基本面数据",
        website="https://simfin.com/",
        is_free=True,
        price_info="免费版有限制",
        registration_required=True,
        api_key_required=True,
        install_command="pip install simfin",
        pros=[
            "基本面数据",
            "免费使用",
            "数据质量好"
        ],
        cons=[
            "需要注册",
            "免费版限制"
        ],
        priority_score=75
    ),
    DataSource(
        name="Intrinio",
        package_name="intrinio_sdk",
        source_type=DataSourceType.INTERNATIONAL_FREE,
        data_types=[DataType.STOCK, DataType.OPTIONS, DataType.FINANCIAL],
        description="金融数据API平台，提供股票、期权数据",
        website="https://intrinio.com/",
        is_free=True,
        price_info="有免费试用",
        registration_required=True,
        api_key_required=True,
        install_command="pip install intrinio_sdk",
        pros=[
            "数据质量高",
            "期权数据",
            "API友好"
        ],
        cons=[
            "免费额度少",
            "需要API Key"
        ],
        priority_score=72
    ),
    DataSource(
        name="FMP",
        package_name="financialmodelingprep",
        source_type=DataSourceType.INTERNATIONAL_FREE,
        data_types=[DataType.STOCK, DataType.FINANCIAL, DataType.INDEX, DataType.CRYPTO],
        description="Financial Modeling Prep，提供财务数据和估值模型",
        website="https://financialmodelingprep.com/",
        is_free=True,
        price_info="免费版250次/天",
        rate_limit="免费版250次/天",
        registration_required=True,
        api_key_required=True,
        install_command="pip install financialmodelingprep",
        pros=[
            "财务数据丰富",
            "估值模型",
            "有免费额度"
        ],
        cons=[
            "需要API Key",
            "高级功能付费"
        ],
        priority_score=80
    ),
    
    # ==================== 更多中国付费数据源 ====================
    DataSource(
        name="聚源数据",
        package_name="gildata",
        source_type=DataSourceType.CHINA_PAID,
        data_types=[
            DataType.STOCK, DataType.FUND, DataType.BOND, DataType.FUTURES,
            DataType.OPTIONS, DataType.MACRO, DataType.FINANCIAL
        ],
        description="恒生聚源金融数据，机构级数据服务",
        website="https://www.gildata.com/",
        is_free=False,
        price_info="年费数万起",
        registration_required=True,
        api_key_required=True,
        pros=[
            "机构级数据",
            "数据全面",
            "技术支持好"
        ],
        cons=[
            "价格昂贵",
            "仅限机构"
        ],
        priority_score=58
    ),
    DataSource(
        name="大智慧",
        package_name="dzh",
        source_type=DataSourceType.CHINA_PAID,
        data_types=[DataType.STOCK, DataType.FUND, DataType.FUTURES, DataType.INDEX],
        description="大智慧金融数据终端",
        website="http://www.gw.com.cn/",
        is_free=False,
        price_info="年费数千起",
        registration_required=True,
        api_key_required=True,
        pros=[
            "老牌数据商",
            "数据稳定"
        ],
        cons=[
            "技术落后",
            "API不友好"
        ],
        priority_score=55
    ),
    DataSource(
        name="巨潮资讯",
        package_name="cninfo",
        source_type=DataSourceType.CHINA_PAID,
        data_types=[DataType.STOCK, DataType.FINANCIAL, DataType.NEWS],
        description="证监会指定信息披露平台",
        website="http://www.cninfo.com.cn/",
        is_free=True,
        price_info="基础免费，高级数据付费",
        registration_required=False,
        api_key_required=False,
        install_command="pip install cnstock",
        pros=[
            "官方披露数据",
            "权威可靠",
            "基础免费"
        ],
        cons=[
            "API不完善",
            "数据种类少"
        ],
        priority_score=75
    ),
    
    # ==================== 更多国际付费数据源 ====================
    DataSource(
        name="FactSet",
        package_name="factset",
        source_type=DataSourceType.INTERNATIONAL_PAID,
        data_types=[
            DataType.STOCK, DataType.FUND, DataType.BOND, DataType.FUTURES,
            DataType.MACRO, DataType.FINANCIAL
        ],
        description="全球金融数据和分析平台",
        website="https://www.factset.com/",
        is_free=False,
        price_info="年费约1.2万美元起",
        registration_required=True,
        api_key_required=True,
        pros=[
            "数据权威",
            "分析工具强",
            "全球覆盖"
        ],
        cons=[
            "价格昂贵",
            "仅限机构"
        ],
        priority_score=52
    ),
    DataSource(
        name="S&P Global",
        package_name="spglobal",
        source_type=DataSourceType.INTERNATIONAL_PAID,
        data_types=[
            DataType.STOCK, DataType.BOND, DataType.INDEX, DataType.MACRO,
            DataType.FINANCIAL
        ],
        description="标普全球市场情报",
        website="https://www.spglobal.com/",
        is_free=False,
        price_info="年费数万美元",
        registration_required=True,
        api_key_required=True,
        pros=[
            "标普数据权威",
            "信用评级",
            "全球覆盖"
        ],
        cons=[
            "价格昂贵",
            "仅限机构"
        ],
        priority_score=53
    ),
    DataSource(
        name="Morningstar Direct",
        package_name="morningstar_direct",
        source_type=DataSourceType.INTERNATIONAL_PAID,
        data_types=[DataType.FUND, DataType.STOCK, DataType.INDEX, DataType.ETF],
        description="晨星专业投资研究平台",
        website="https://www.morningstar.com/products/direct",
        is_free=False,
        price_info="年费数千美元",
        registration_required=True,
        api_key_required=True,
        pros=[
            "基金研究权威",
            "评级体系完善",
            "全球基金覆盖"
        ],
        cons=[
            "价格较高",
            "主要基金数据"
        ],
        priority_score=60
    ),
    DataSource(
        name="Quandl Premium",
        package_name="quandl",
        source_type=DataSourceType.INTERNATIONAL_PAID,
        data_types=[
            DataType.STOCK, DataType.FUTURES, DataType.MACRO, DataType.ALTERNATIVE
        ],
        description="Quandl高级数据订阅",
        website="https://www.quandl.com/",
        is_free=False,
        price_info="按数据集收费",
        registration_required=True,
        api_key_required=True,
        pros=[
            "另类数据丰富",
            "数据质量高",
            "专业数据"
        ],
        cons=[
            "按数据集收费",
            "成本高"
        ],
        priority_score=62
    ),
]

def get_sources_by_type(source_type: DataSourceType) -> list[DataSource]:
    return [s for s in DATA_SOURCES if s.source_type == source_type]

def get_sources_by_data_type(data_type: DataType) -> list[DataSource]:
    return [s for s in DATA_SOURCES if data_type in s.data_types]

def get_free_sources() -> list[DataSource]:
    return [s for s in DATA_SOURCES if s.is_free]

def get_paid_sources() -> list[DataSource]:
    return [s for s in DATA_SOURCES if not s.is_free]
